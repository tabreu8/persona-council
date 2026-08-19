# RFC: unify customer data into a single analytics store

**Author:** Platform · **Status:** proposed

## Goal

Product, support and marketing each keep their own copy of customer event data.
We propose one store: every service writes events to a shared warehouse, and all
three teams query it directly.

## Design

- All services emit events to a single stream, fanned into the warehouse
- Full event payloads retained indefinitely — storage is cheap and we cannot
  predict which fields will matter later
- Read access granted to the product, support and marketing teams
- Marketing gets a nightly export into their campaign tool for segmentation

## Migration

Dual-write for two weeks, then cut over and decommission the three existing
stores.

## Non-goals

- Changing what any team does with the data today
