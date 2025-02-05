/*
  Warnings:

  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isCorrect` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `totalPoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Badge` table. All the data in the column will be lost.
  - Added the required column `position` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `image` on table `Badge` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Question";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "correctAnswer" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "order" INTEGER NOT NULL DEFAULT 0,
    "badgeId" TEXT,
    CONSTRAINT "questions_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BadgeToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BadgeToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BadgeToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answer" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Answer" ("answer", "createdAt", "id", "questionId", "updatedAt", "userId") SELECT "answer", "createdAt", "id", "questionId", "updatedAt", "userId" FROM "Answer";
DROP TABLE "Answer";
ALTER TABLE "new_Answer" RENAME TO "Answer";
CREATE UNIQUE INDEX "Answer_userId_questionId_key" ON "Answer"("userId", "questionId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'General',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedQuestions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "progress", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "progress", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "requiredXP" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Badge" ("createdAt", "description", "icon", "id", "image", "name", "updatedAt") SELECT "createdAt", "description", "icon", "id", "image", "name", "updatedAt" FROM "Badge";
DROP TABLE "Badge";
ALTER TABLE "new_Badge" RENAME TO "Badge";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_BadgeToUser_AB_unique" ON "_BadgeToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_BadgeToUser_B_index" ON "_BadgeToUser"("B");
