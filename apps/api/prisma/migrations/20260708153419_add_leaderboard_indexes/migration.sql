-- CreateIndex
CREATE INDEX "Student_grade_idx" ON "Student"("grade");

-- CreateIndex
CREATE INDEX "Student_province_idx" ON "Student"("province");

-- CreateIndex
CREATE INDEX "TestAttempt_studentId_status_idx" ON "TestAttempt"("studentId", "status");

-- CreateIndex
CREATE INDEX "TestAttempt_examId_idx" ON "TestAttempt"("examId");

-- CreateIndex
CREATE INDEX "UserGamification_xp_idx" ON "UserGamification"("xp");

-- CreateIndex
CREATE INDEX "UserGamification_streakDays_idx" ON "UserGamification"("streakDays");
