CREATE TABLE "StatDay" (
    "day" TEXT NOT NULL,
    "views" INTEGER NOT NULL,
    "visitors" INTEGER NOT NULL,
    "durationSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatDay_pkey" PRIMARY KEY ("day")
);

CREATE TABLE "StatDimension" (
    "day" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "views" INTEGER NOT NULL,

    CONSTRAINT "StatDimension_pkey" PRIMARY KEY ("day","dimension","value")
);

CREATE INDEX "StatDimension_dimension_day_idx" ON "StatDimension"("dimension", "day");
