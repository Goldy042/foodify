-- Link staff members to app users and support invite acceptance.
ALTER TABLE "RestaurantStaffMember"
ADD COLUMN "userId" UUID,
ADD COLUMN "inviteToken" TEXT,
ADD COLUMN "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN "acceptedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "RestaurantStaffMember_userId_key"
ON "RestaurantStaffMember"("userId");

CREATE UNIQUE INDEX "RestaurantStaffMember_inviteToken_key"
ON "RestaurantStaffMember"("inviteToken");

CREATE INDEX "RestaurantStaffMember_inviteToken_inviteExpiresAt_idx"
ON "RestaurantStaffMember"("inviteToken", "inviteExpiresAt");

ALTER TABLE "RestaurantStaffMember"
ADD CONSTRAINT "RestaurantStaffMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
