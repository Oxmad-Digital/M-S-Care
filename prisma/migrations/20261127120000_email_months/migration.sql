CREATE TABLE "EmailMonth" (
    "month" TEXT NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailMonth_pkey" PRIMARY KEY ("month")
);
