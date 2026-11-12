<?php

namespace App\Traits;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use stdClass;
use Symfony\Component\HttpFoundation\Response;

trait ResponseTrait
{
    // ******************************************************************************************************************
    // Public Functions
    // ******************************************************************************************************************

    /**
     * @param  array<string, mixed>  $meta
     */
    public function success(int $code = Response::HTTP_OK, ?string $message = null, mixed $data = null, array $meta = [], ?string $status = 'success'): JsonResponse
    {
        $base =
            [
                'status' => $status ?? 'success',
                'message' => $message,
                'meta' => $this->metaMerger($meta),
            ];

        $response = $this->responseMerger($data, $base);

        return response()->json($response, $code);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public static function error(int|null|string $code, string $message, string $trigger_file = '', ?string $trigger_line = null, mixed $data = null, array $meta = []): JsonResponse
    {
        $validCode = is_int($code) && $code >= 100 && $code < 600;
        $exception_code = $code === 0 || is_string($code) || ! $validCode
            ? Response::HTTP_CONFLICT
            : $code;

        return response()->json([
            'status' => 'error',
            'code' => $exception_code,
            'message' => $message,
            'file' => $trigger_file,
            'line' => $trigger_line,
            'meta' => self::metaMerger($meta),
            'data' => $data,
        ], $exception_code);
    }

    // ******************************************************************************************************************
    // Protected Functions
    // ******************************************************************************************************************

    /**
     * @param  array<string, mixed>  $meta
     * @return array<string, mixed>
     */
    protected static function metaMerger(array $meta): array
    {
        return array_merge($meta, [
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function failedValidation(Validator $validator): never
    {
        $response = response()->json([
            'success' => false,
            'errors' => $validator->errors(),
        ], 422);

        Log::error($response);
        throw new ValidationException($validator, $response);
    }

    /**
     * @param  array<string, mixed>  $base
     * @return array<string, mixed>
     */
    protected function responseMerger(mixed $data, array $base): array
    {
        if (isset($data->resource) && $data->resource instanceof LengthAwarePaginator) {
            $resData = $data->resource->toArray();
        } elseif ($data instanceof LengthAwarePaginator) {
            $resData = $data->toArray();
        } elseif ($data instanceof stdClass) {
            $resData = (array) $data;
        } else {
            $resData = ['data' => $data];
        }

        $response = array_merge($base, $resData);

        return $response;
    }
}
