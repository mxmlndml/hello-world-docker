const { WHO_TO_GREET } = process.env;

console.log(`Hello ${WHO_TO_GREET ?? "World"}!`);
