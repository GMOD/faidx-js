import fs from "fs";
import { generateFastaIndex } from "../src";

test("gather", async () => {
  await generateFastaIndex(
    "out.fai",
    fs.createReadStream(require.resolve("./volvox.fa"))
  );
  const r = fs.readFileSync("out.fai", "utf8");
  expect(r).toMatchSnapshot();
});
