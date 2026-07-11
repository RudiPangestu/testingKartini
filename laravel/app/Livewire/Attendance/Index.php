<?php

namespace App\Livewire\Attendance;

use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Schedule;
use App\Models\Student;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Index extends Component
{
    public string $scheduleId = '';
    public string $date = '';

    /** statuses[studentId] = HADIR|SAKIT|IZIN|ALPHA */
    public array $statuses = [];

    public function mount(): void
    {
        $this->date = now()->format('Y-m-d');
    }

    public function updatedScheduleId(): void
    {
        $this->hydrate();
    }

    public function updatedDate(): void
    {
        $this->hydrate();
    }

    protected function hydrate(): void
    {
        $this->statuses = [];
        $sched = $this->scheduleId ? Schedule::find($this->scheduleId) : null;
        if (! $sched) {
            return;
        }

        $students = Student::where('class_id', $sched->class_id)->pluck('id');
        $existing = [];
        $sess = AttendanceSession::where('schedule_id', $this->scheduleId)
            ->whereDate('session_date', $this->date)->first();
        if ($sess) {
            $existing = Attendance::where('session_id', $sess->id)->pluck('status', 'student_id')->toArray();
        }

        foreach ($students as $sid) {
            $this->statuses[$sid] = $existing[$sid] ?? 'HADIR';
        }
    }

    public function save(): void
    {
        $this->validate([
            'scheduleId' => ['required', 'exists:schedules,id'],
            'date' => ['required', 'date'],
        ]);

        $sched = Schedule::findOrFail($this->scheduleId);

        $sess = AttendanceSession::where('schedule_id', $this->scheduleId)
            ->whereDate('session_date', $this->date)->first();
        if (! $sess) {
            $sess = AttendanceSession::create([
                'source_type' => 'SCHEDULE',
                'schedule_id' => $this->scheduleId,
                'class_id' => $sched->class_id,
                'session_date' => $this->date,
                'created_by' => auth()->id(),
            ]);
        }

        foreach ($this->statuses as $studentId => $status) {
            Attendance::updateOrCreate(
                ['session_id' => $sess->id, 'student_id' => $studentId],
                ['status' => $status, 'recorded_by' => auth()->id()],
            );
        }

        session()->flash('ok', 'Presensi tersimpan.');
    }

    public function render()
    {
        $schedules = Schedule::with(['subject', 'schoolClass'])
            ->orderBy('class_id')->get();

        $students = collect();
        if ($this->scheduleId) {
            $sched = Schedule::find($this->scheduleId);
            if ($sched) {
                $students = Student::where('class_id', $sched->class_id)->orderBy('full_name')->get(['id', 'nisn', 'full_name']);
            }
        }

        return view('livewire.attendance.index', compact('schedules', 'students'));
    }
}
