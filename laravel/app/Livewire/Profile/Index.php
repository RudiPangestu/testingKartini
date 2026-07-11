<?php

namespace App\Livewire\Profile;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Index extends Component
{
    public string $full_name = '';
    public string $phone = '';
    public string $password = '';
    public string $password_confirmation = '';

    public function mount(): void
    {
        $u = auth()->user();
        $this->full_name = $u->full_name;
        $this->phone = $u->phone ?? '';
    }

    public function save(): void
    {
        $this->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'password' => ['nullable', 'min:6', 'confirmed'],
        ]);

        $data = ['full_name' => $this->full_name, 'phone' => $this->phone ?: null];
        if ($this->password) {
            $data['password_hash'] = Hash::make($this->password);
        }

        User::whereKey(auth()->id())->update($data);
        $this->reset(['password', 'password_confirmation']);
        session()->flash('ok', 'Profil disimpan.');
    }

    public function render()
    {
        return view('livewire.profile.index', ['user' => auth()->user()]);
    }
}
