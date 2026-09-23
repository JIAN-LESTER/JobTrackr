<?php

namespace App\Services;

use GuzzleHttp\Cookie\CookieJarInterface;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Psr\Http\Message\ResponseInterface;
use RuntimeException;
use Throwable;

class SafeHttpFetcher
{
    private const MAX_REDIRECTS = 5;

    private const MAX_RESPONSE_BYTES = 2_000_000;

    /** @param array<string, string> $headers */
    public function get(string $url, array $headers = [], ?CookieJarInterface $cookies = null, int $timeout = 8): Response
    {
        $currentUrl = $url;

        for ($redirects = 0; $redirects <= self::MAX_REDIRECTS; $redirects++) {
            $this->assertPublicHttpUrl($currentUrl);

            $options = [
                'allow_redirects' => false,
                'on_headers' => function (ResponseInterface $response): void {
                    $length = (int) $response->getHeaderLine('Content-Length');

                    if ($length > self::MAX_RESPONSE_BYTES) {
                        throw new RuntimeException('The remote response is too large.');
                    }
                },
                'progress' => function (int $downloadTotal, int $downloadedBytes): void {
                    if ($downloadTotal > self::MAX_RESPONSE_BYTES || $downloadedBytes > self::MAX_RESPONSE_BYTES) {
                        throw new RuntimeException('The remote response is too large.');
                    }
                },
            ];

            if ($cookies) {
                $options['cookies'] = $cookies;
            }

            try {
                $response = Http::timeout($timeout)
                    ->connectTimeout(min(5, $timeout))
                    ->withHeaders($headers)
                    ->withOptions($options)
                    ->get($currentUrl);
            } catch (Throwable $exception) {
                Log::warning('Outbound URL fetch failed.', [
                    'host' => parse_url($currentUrl, PHP_URL_HOST),
                    'exception' => $exception::class,
                ]);

                throw $exception;
            }

            if (strlen($response->body()) > self::MAX_RESPONSE_BYTES) {
                throw new RuntimeException('The remote response is too large.');
            }

            if (! $response->redirect()) {
                Log::info('Safe outbound URL fetched.', [
                    'host' => parse_url($currentUrl, PHP_URL_HOST),
                    'status' => $response->status(),
                    'response_bytes' => strlen($response->body()),
                ]);

                return $response;
            }

            $location = $response->header('Location');

            if ($location === '') {
                return $response;
            }

            $currentUrl = (string) UriResolver::resolve(new Uri($currentUrl), new Uri($location));
        }

        throw new RuntimeException('The remote URL redirected too many times.');
    }

    private function assertPublicHttpUrl(string $url): void
    {
        $parts = parse_url($url);

        if (! is_array($parts)) {
            $this->reject($url, 'invalid URL');
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower(rtrim((string) ($parts['host'] ?? ''), '.'));

        if (
            ! in_array($scheme, ['http', 'https'], true)
            || $host === ''
            || isset($parts['user'])
            || isset($parts['pass'])
            || $host === 'localhost'
            || str_ends_with($host, '.localhost')
            || str_ends_with($host, '.local')
            || str_ends_with($host, '.internal')
        ) {
            $this->reject($url, 'invalid or local URL');
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            if (! $this->isPublicIp($host)) {
                $this->reject($url, 'non-public IP address');
            }

            return;
        }

        if (app()->environment('testing')) {
            return;
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];
        $addresses = [];

        foreach ($records as $record) {
            $address = $record['ip'] ?? $record['ipv6'] ?? null;

            if (is_string($address)) {
                $addresses[] = $address;
            }
        }

        if ($addresses === [] || collect($addresses)->contains(fn (string $address) => ! $this->isPublicIp($address))) {
            $this->reject($url, $addresses === [] ? 'host did not resolve' : 'host resolved to a non-public IP address');
        }
    }

    private function isPublicIp(string $address): bool
    {
        return filter_var(
            $address,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }

    private function reject(string $url, string $reason): never
    {
        Log::warning('Unsafe outbound URL blocked.', [
            'host' => parse_url($url, PHP_URL_HOST),
            'reason' => $reason,
        ]);

        throw new RuntimeException('The supplied URL cannot be fetched safely.');
    }
}
