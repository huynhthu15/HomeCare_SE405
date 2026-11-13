-- Separate database for e2e tests so `pnpm test:e2e` never wipes dev data.
CREATE DATABASE homecare_test OWNER homecare;
