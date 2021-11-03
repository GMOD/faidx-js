import fs from "fs";
import { generateFastaIndex } from "../src";

test("gather", async () => {
  await generateFastaIndex(
    "out.fai",
    fs.createReadStream(require.resolve("./volvox.fa"))
  );
});
