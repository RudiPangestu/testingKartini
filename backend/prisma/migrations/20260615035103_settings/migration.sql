-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "channel_push" BOOLEAN NOT NULL DEFAULT true,
    "channel_email" BOOLEAN NOT NULL DEFAULT true,
    "channel_wa" BOOLEAN NOT NULL DEFAULT false,
    "notify_statuses" TEXT[],
    "attendance_template" TEXT NOT NULL,
    "reminder_template" TEXT NOT NULL,
    "reminder_hour" INTEGER NOT NULL DEFAULT 17,
    "weekly_recap_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
