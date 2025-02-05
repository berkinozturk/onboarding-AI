-- RedefineTables
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_User" ("completedQuestions", "createdAt", "department", "email", "id", "level", "name", "password", "position", "role", "startDate", "updatedAt", "xp") SELECT "completedQuestions", "createdAt", "department", "email", "id", "level", "name", "password", "position", "role", "startDate", "updatedAt", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
