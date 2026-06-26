<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $primaryKey = 'company_id';

    protected $fillable = [
        'name',
        'industry',
        'website',
        'email',
        'phone',
        'address',
    ];

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
