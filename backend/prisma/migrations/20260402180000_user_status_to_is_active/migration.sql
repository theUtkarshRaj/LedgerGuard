-- Rename User.status -> isActive for clearer API/DB naming
ALTER TABLE "User" RENAME COLUMN "status" TO "isActive";
