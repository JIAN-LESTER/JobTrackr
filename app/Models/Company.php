<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $primaryKey = 'company_id';

    protected $fillable = [
        'name',
        'industry',
        'website',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'company_id', 'company_id');
    }
}
