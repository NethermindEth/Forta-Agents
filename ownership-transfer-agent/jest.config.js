module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!(node-fetch))"
  ],
  testPathIgnorePatterns: ["dist"],
};
