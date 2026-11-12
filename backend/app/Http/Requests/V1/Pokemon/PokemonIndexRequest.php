<?php

namespace App\Http\Requests\V1\Pokemon;

use App\Traits\ResponseTrait;
use Illuminate\Foundation\Http\FormRequest;

class PokemonIndexRequest extends FormRequest
{
    use ResponseTrait;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'search' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function page(): int
    {
        return (int) ($this->validated('page') ?? 1);
    }

    public function limit(): int
    {
        return (int) ($this->validated('limit') ?? 20);
    }

    public function search(): ?string
    {
        return $this->validated('search');
    }
}
