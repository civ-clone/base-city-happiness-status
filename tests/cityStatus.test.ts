import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import {
  cityStatus,
  forgetCityStatuses,
  registerCityStatusHandler,
  updateCityStatus,
} from '../lib/cityStatus';
import City from '@civ-clone/core-city/City';
import Engine from '@civ-clone/core-engine/Engine';
import { expect } from 'chai';

const UPSET = 'test:upset',
  CHEERFUL = 'test:cheerful';

describe('cityStatus', (): void => {
  const setUp = () => {
    const pendingEffects = new PendingEffectRegistry(),
      events: [string, unknown][] = [],
      engine = {
        emit: (event: string, target: unknown) => events.push([event, target]),
      } as unknown as Engine,
      city = {} as City,
      otherCity = {} as City;

    registerCityStatusHandler(UPSET, 'city:calm', pendingEffects, engine);
    registerCityStatusHandler(CHEERFUL, 'city:glum', pendingEffects, engine);

    return { pendingEffects, events, city, otherCity };
  };

  it('has no status until one is recorded', (): void => {
    const { pendingEffects, city } = setUp();

    expect(cityStatus(UPSET, city, pendingEffects)).null;
  });

  it('records a status that has started, calling onStart first, and keeps it while it goes on', (): void => {
    const { pendingEffects, events, city, otherCity } = setUp(),
      started: number[] = [];

    updateCityStatus(UPSET, city, true, null, pendingEffects, () =>
      started.push(pendingEffects.entries().length)
    );

    const recorded = cityStatus(UPSET, city, pendingEffects);

    expect(started).eql([0]);
    expect(recorded?.handler()).equal(UPSET);
    expect(recorded?.target()).equal(city);
    expect(cityStatus(CHEERFUL, city, pendingEffects)).null;
    expect(cityStatus(UPSET, otherCity, pendingEffects)).null;

    // The next turn: still active, and the status recorded last turn is kept rather than recorded again.
    updateCityStatus(UPSET, city, true, recorded, pendingEffects, () =>
      started.push(-1)
    );

    expect(started).eql([0]);
    expect(pendingEffects.getByTarget(city).length).equal(1);
    expect(cityStatus(UPSET, city, pendingEffects)).equal(recorded);
    expect(events).eql([]);
  });

  it('ends a status that has stopped, emitting its event', (): void => {
    const { pendingEffects, events, city } = setUp();

    updateCityStatus(UPSET, city, true, null, pendingEffects);
    updateCityStatus(
      UPSET,
      city,
      false,
      cityStatus(UPSET, city, pendingEffects),
      pendingEffects
    );

    expect(cityStatus(UPSET, city, pendingEffects)).null;
    expect(events).eql([['city:calm', city]]);
  });

  it('does nothing for a status that is neither active nor recorded', (): void => {
    const { pendingEffects, events, city } = setUp();

    updateCityStatus(UPSET, city, false, null, pendingEffects);

    expect(pendingEffects.entries()).eql([]);
    expect(events).eql([]);
  });

  it('forgets only the named statuses of the city, without ending them', (): void => {
    const { pendingEffects, events, city, otherCity } = setUp(),
      unrelated = new PendingEffect('test:other', city);

    pendingEffects.register(unrelated);
    updateCityStatus(UPSET, city, true, null, pendingEffects);
    updateCityStatus(CHEERFUL, city, true, null, pendingEffects);
    updateCityStatus(UPSET, otherCity, true, null, pendingEffects);

    forgetCityStatuses(city, [UPSET, CHEERFUL], pendingEffects);

    expect(cityStatus(UPSET, city, pendingEffects)).null;
    expect(cityStatus(CHEERFUL, city, pendingEffects)).null;
    expect(cityStatus(UPSET, otherCity, pendingEffects)).not.null;
    expect(pendingEffects.getByTarget(city)).eql([unrelated]);
    expect(events).eql([]);
  });
});
