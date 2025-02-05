/*
  Warnings:

  - You are about to drop the `_BadgeToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `completedQuestions` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `requiredXP` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `badgeId` on the `Question` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_BadgeToUser_B_index";

-- DropIndex
DROP INDEX "_BadgeToUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BadgeToUser";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "progress", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "progress", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'ACHIEVEMENT',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'star',
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Badge" ("createdAt", "description", "icon", "id", "image", "name", "updatedAt") SELECT "createdAt", "description", "icon", "id", "image", "name", "updatedAt" FROM "Badge";
DROP TABLE "Badge";
ALTER TABLE "new_Badge" RENAME TO "Badge";
CREATE TABLE "new_Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Answer" ("answer", "createdAt", "id", "questionId", "updatedAt", "userId") SELECT "answer", "createdAt", "id", "questionId", "updatedAt", "userId" FROM "Answer";
DROP TABLE "Answer";
ALTER TABLE "new_Answer" RENAME TO "Answer";
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "options" TEXT,
    "correctAnswer" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Question" ("category", "correctAnswer", "createdAt", "id", "options", "order", "text", "type", "updatedAt", "xpReward") SELECT "category", "correctAnswer", "createdAt", "id", "options", "order", "text", "type", "updatedAt", "xpReward" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
