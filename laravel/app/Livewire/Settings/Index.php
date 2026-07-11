<?php

namespace App\Livewire\Settings;

use App\Models\Setting;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Index extends Component
{
    public bool $channel_push = true;
    public bool $channel_email = true;
    public bool $channel_wa = false;
    public array $notify_statuses = [];
    public string $attendance_template = '';
    public string $reminder_template = '';
    public int $reminder_hour = 17;
    public bool $weekly_recap_enabled = false;

    public function mount(): void
    {
        $s = Setting::current();
        $this->channel_push = $s->channel_push;
        $this->channel_email = $s->channel_email;
        $this->channel_wa = $s->channel_wa;
        $this->notify_statuses = $s->notify_statuses ?? [];
        $this->attendance_template = $s->attendance_template;
        $this->reminder_template = $s->reminder_template;
        $this->reminder_hour = $s->reminder_hour;
        $this->weekly_recap_enabled = $s->weekly_recap_enabled;
    }

    public function save(): void
    {
        $this->validate([
            'reminder_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'attendance_template' => ['required', 'string'],
            'reminder_template' => ['required', 'string'],
            'notify_statuses' => ['array'],
            'notify_statuses.*' => [Rule::in(['HADIR', 'SAKIT', 'IZIN', 'ALPHA'])],
        ]);

        Setting::current()->update([
            'channel_push' => $this->channel_push,
            'channel_email' => $this->channel_email,
            'channel_wa' => $this->channel_wa,
            'notify_statuses' => array_values($this->notify_statuses),
            'attendance_template' => $this->attendance_template,
            'reminder_template' => $this->reminder_template,
            'reminder_hour' => $this->reminder_hour,
            'weekly_recap_enabled' => $this->weekly_recap_enabled,
        ]);

        session()->flash('ok', 'Pengaturan disimpan.');
    }

    public function render()
    {
        return view('livewire.settings.index');
    }
}
