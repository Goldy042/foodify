-- Browse performance indexes for customer restaurant discovery.
CREATE INDEX "User_status_isSuspended_idx" ON "User"("status", "isSuspended");

CREATE INDEX "RestaurantProfile_area_idx" ON "RestaurantProfile"("area");
CREATE INDEX "RestaurantProfile_prepTimeRange_idx" ON "RestaurantProfile"("prepTimeRange");
CREATE INDEX "RestaurantProfile_createdAt_idx" ON "RestaurantProfile"("createdAt");
CREATE INDEX "RestaurantProfile_area_prepTimeRange_createdAt_idx"
  ON "RestaurantProfile"("area", "prepTimeRange", "createdAt");
CREATE INDEX "RestaurantProfile_cuisineTypes_idx"
  ON "RestaurantProfile" USING GIN ("cuisineTypes");
CREATE INDEX "RestaurantProfile_daysOpen_idx"
  ON "RestaurantProfile" USING GIN ("daysOpen");

CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");
