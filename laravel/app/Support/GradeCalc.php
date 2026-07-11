<?php

namespace App\Support;

/**
 * Perhitungan nilai K13 (port dari grades.service.ts):
 * NA komponen → Nilai KD (rata NA komponen yang ada) → NR (rata Nilai KD) → predikat/tuntas.
 */
class GradeCalc
{
    /** Rata-rata dari nilai non-null, dibulatkan 2 desimal. */
    public static function avg(array $vals): ?float
    {
        $vals = array_values(array_filter($vals, fn ($v) => $v !== null && $v !== ''));
        if (count($vals) === 0) {
            return null;
        }

        return round(array_sum(array_map('floatval', $vals)) / count($vals), 2);
    }

    /** Predikat: A ≥ 86, B ≥ 71, C ≥ 56, D < 56. */
    public static function predikat(?float $nr): ?string
    {
        if ($nr === null) {
            return null;
        }
        if ($nr >= 86) {
            return 'A';
        }
        if ($nr >= 71) {
            return 'B';
        }
        if ($nr >= 56) {
            return 'C';
        }

        return 'D';
    }
}
