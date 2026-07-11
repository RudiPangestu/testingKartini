<?php

namespace App\Livewire\Announcements;

use App\Models\Notification;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Index extends Component
{
    public string $title = '';
    public string $body = '';
    public string $audience = 'ALL_ORTU';
    public string $target_class_id = '';

    public function send(): void
    {
        $this->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'audience' => ['required', Rule::in(['ALL', 'ALL_ORTU', 'CLASS'])],
            'target_class_id' => [Rule::requiredIf($this->audience === 'CLASS'), 'nullable', 'exists:classes,id'],
        ]);

        $ids = match ($this->audience) {
            'ALL' => User::pluck('id'),
            'ALL_ORTU' => User::where('role', 'ORTU')->pluck('id'),
            'CLASS' => StudentParent::whereIn(
                'student_id',
                Student::where('class_id', $this->target_class_id)->pluck('id')
            )->pluck('parent_user_id')->unique()->values(),
            default => collect(),
        };

        foreach ($ids as $uid) {
            Notification::create([
                'user_id' => $uid,
                'type' => 'INFO',
                'title' => $this->title,
                'body' => $this->body,
                'channel' => 'PUSH',
            ]);
        }

        $this->reset(['title', 'body', 'target_class_id']);
        session()->flash('ok', 'Pengumuman terkirim ke '.$ids->count().' penerima.');
    }

    public function render()
    {
        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $recent = Notification::where('type', 'INFO')
            ->orderBy('sent_at', 'desc')->limit(60)->get(['title', 'body', 'sent_at'])
            ->unique('title')->take(15)->values();

        return view('livewire.announcements.index', compact('classes', 'recent'));
    }
}
