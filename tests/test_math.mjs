import test from "node:test";
import assert from "node:assert/strict";
import {euclidean, featureDifferences, neighborhoodProfile, nearestRecords, percentileOf, radvizPoint, starPoint} from "../app/static/js/math.js";

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

test("star coordinates places a value of 1 exactly on the axis tip (same scale as the drawn vector)", () => {
  const axes = Object.fromEntries(features.map((feature, i) => [feature, {angle: i * Math.PI / 3, weight: i === 2 ? 1.4 : 1}]));
  const point = starPoint(record([0,0,1,0,0,0]), axes);
  assert.ok(Math.abs(point.x - 1.4 * Math.cos(2 * Math.PI / 3)) < 1e-12);
  assert.ok(Math.abs(point.y - 1.4 * Math.sin(2 * Math.PI / 3)) < 1e-12);
});

test("star coordinates is the sum of the weighted axis vectors", () => {
  const axes = Object.fromEntries(features.map((feature, i) => [feature, {angle: i === 0 ? 0 : Math.PI / 2, weight: 1}]));
  const point = starPoint(record([0.5,0.25,0,0,0,0]), axes);
  assert.ok(Math.abs(point.x - 0.5) < 1e-12);
  assert.ok(Math.abs(point.y - 0.25) < 1e-12);
});

test("percentileOf returns the share of reference values at or below the value", () => {
  const percentiles = Array.from({length: 101}, (_, i) => i / 100);
  assert.equal(percentileOf(percentiles, -1), 0);
  assert.equal(percentileOf(percentiles, 2), 1);
  assert.ok(Math.abs(percentileOf(percentiles, 0.5) - 51 / 101) < 1e-12);
  assert.equal(percentileOf([], 0.3), null);
});

test("featureDifferences sorts the attributes from the largest to the smallest gap", () => {
  const differences = featureDifferences(record([0.9,0.5,0.1,0,0,0]), record([0.1,0.5,0.4,0,0,0]));
  assert.equal(differences[0].feature, "energy");
  assert.equal(differences[1].feature, "danceability");
  assert.ok(Math.abs(differences[0].value - 0.8) < 1e-12);
});

test("neighborhoodProfile averages the absolute differences per attribute", () => {
  const selected = record([0.5,0.5,0.5,0,0,0]);
  const neighbors = [{record: record([0.5,0.7,0.1,0,0,0])}, {record: record([0.5,0.3,0.5,0,0,0])}];
  const profile = neighborhoodProfile(selected, neighbors);
  assert.equal(profile[0].value, 0);
  assert.equal(profile.at(-1).feature, "danceability");
  assert.ok(Math.abs(profile.at(-1).value - 0.2) < 1e-12);
});
