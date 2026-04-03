"use strict";

const prismaPath = require.resolve("../src/config/prisma.js");

function setPrismaMock(fakeExports) {
  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: fakeExports,
  };
}

function clearCached(path) {
  delete require.cache[require.resolve(path)];
}

function teardownPrismaServiceMocks() {
  delete require.cache[prismaPath];
  clearCached("../src/services/record.service.js");
  clearCached("../src/services/user.service.js");
}

module.exports = { setPrismaMock, teardownPrismaServiceMocks };
