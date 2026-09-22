import test from "node:test";
import assert from "node:assert/strict";
import {euclidean, nearestRecords, radvizPoint, starPoint} from "../app/static/js/math.js";

const features = ["energy", "valence", "danceability", "acousticness", "instrumentalness", "speechiness"];
const record = values => ({uid: values.join("-"), normalized: Object.fromEntries(features.map((feature, i) => [feature, values[i]]))});

test("euclidean returns zero for identical profiles", () => {
  const values = Object.fromEntries(features.map(feature => [feature, 0.5]));
  assert.equal(euclidean(values, values), 0);
});

test("nearest records excludes the selected item and orders distances", () => {
  const records = [record([0,0,0,0,0,0]), record([0.1,0,0,0,0,0]), record([0.4,0,0,0,0,0])];
  const nearest = nearestRecords(records, records[0].uid, 2);
  assert.deepEqual(nearest.map(item => item.record.uid), [records[1].uid, records[2].uid]);
});

test("radviz reports undefined position when every weight is zero", () => {
  const anchors = Object.fromEntries(features.map((feature, i) => [feature, {x: Math.cos(i), y: Math.sin(i)}]));
  assert.equal(radvizPoint(record([0,0,0,0,0,0]), anchors), null);
});

test("star coordinates follows the single active axis", () => {
  const axes = Object.fromEntries(features.map((feature, i) => [feature, {angle: i === 0 ? 0 : Math.PI, weight: 1}]));
  const point = starPoint(record([1,0,0,0,0,0]), axes);
  assert.ok(point.x > 0);
  assert.ok(Math.abs(point.y) < 1e-12);
});
