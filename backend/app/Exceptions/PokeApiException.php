<?php

namespace App\Exceptions;

use App\Traits\ResponseTrait;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class PokeApiException extends RuntimeException
{
    use ResponseTrait;

    public static function unavailable(?\Throwable $previous = null): self
    {
        return new self('Unable to fetch data from PokeAPI.', 0, $previous);
    }

    public function render(): JsonResponse
    {
        return self::error(502, $this->getMessage());
    }
}
