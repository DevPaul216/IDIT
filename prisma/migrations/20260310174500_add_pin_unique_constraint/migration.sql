-- Add unique constraint to User.pin to prevent duplicate PINs

CREATE UNIQUE INDEX "User_pin_key" ON "User"("pin");
