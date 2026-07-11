<?php

namespace App\Livewire\Family;

use App\Models\Attendance;
use App\Models\Student;
use App\Models\StudentParent;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Reports extends Component
{
    public function render()
    {
        $user = auth()->user();

        $studentIds = $user->role->value === 'ORTU'
            ? StudentParent::where('parent_user_id', $user->id)->pluck('student_id')
            : Student::where('user_id', $user->id)->pluck('id');

        $students = Student::whereIn('id', $studentIds)->with('schoolClass')->orderBy('full_name')->get();
        $recs = Attendance::whereIn('student_id', $studentIds)->get(['student_id', 'status']);

        $agg = [];
        foreach ($recs as $r) {
            $st = $r->status->value;
            $agg[$r->student_id][$st] = ($agg[$r->student_id][$st] ?? 0) + 1;
        }

        $rows = $students->map(function ($st) use ($agg) {
            $c = $agg[$st->id] ?? [];
            $h = $c['HADIR'] ?? 0;
            $s = $c['SAKIT'] ?? 0;
            $i = $c['IZIN'] ?? 0;
            $a = $c['ALPHA'] ?? 0;
            $tot = $h + $s + $i + $a;

            return [
                'name' => $st->full_name,
                'class' => $st->schoolClass?->name ?? '—',
                'h' => $h, 's' => $s, 'i' => $i, 'a' => $a, 'tot' => $tot,
                'pct' => $tot ? round($h / $tot * 100, 1) : null,
            ];
        });

        return view('livewire.family.reports', compact('rows'));
    }
}
