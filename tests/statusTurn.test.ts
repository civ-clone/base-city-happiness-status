import { CityStatusCheck, cityStatusTurn } from '../lib/statusTurn';
import { cityStatus, registerCityStatusHandler } from '../lib/cityStatus';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import City from '@civ-clone/core-city/City';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Effect from '@civ-clone/core-rule/Effect';
import Engine from '@civ-clone/core-engine/Engine';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { expect } from 'chai';

const UPSET = 'test:upset',
  CHEERFUL = 'test:cheerful';

describe('cityStatusTurn', (): void => {
  const setUp = () => {
    const pendingEffects = new PendingEffectRegistry(),
      ruleRegistry = new RuleRegistry(),
      events: [string, unknown][] = [],
      engine = {
        emit: (event: string, target: unknown) => events.push([event, target]),
      } as unknown as Engine,
      // What each city's check finds this turn, by name.
      state: { [name: string]: { disorder: boolean; celebrating: boolean } } =
        {},
      yieldsAsked: string[] = [],
      city = (name: string) =>
        ({
          name,
          yields: () => {
            yieldsAsked.push(name);

            return [name];
          },
        } as unknown as City),
      a = city('a'),
      b = city('b');

    ruleRegistry.register(
      new CivilDisorder(
        new Effect(
          (city: City, yields: unknown[]): boolean =>
            yields[0] === (city as any).name &&
            state[(city as any).name].disorder
        )
      ),
      new CelebrateLeader(
        new Effect(
          (city: City, yields: unknown[]): boolean =>
            yields[0] === (city as any).name &&
            state[(city as any).name].celebrating
        )
      )
    );

    registerCityStatusHandler(
      UPSET,
      'city:order-restored',
      pendingEffects,
      engine
    );
    registerCityStatusHandler(
      CHEERFUL,
      'city:celebration-ended',
      pendingEffects,
      engine
    );

    const turn = (extra: object = {}) =>
      cityStatusTurn([a, b], {
        disorderHandler: UPSET,
        celebrationHandler: CHEERFUL,
        pendingEffects,
        ruleRegistry,
        engine,
        ...extra,
      });

    return { pendingEffects, events, state, yieldsAsked, a, b, turn };
  };

  it('works out the yields once per city, records disorder and celebrations as they start and ends them as they stop', (): void => {
    const { pendingEffects, events, state, yieldsAsked, a, b, turn } = setUp();

    state.a = { disorder: true, celebrating: false };
    state.b = { disorder: false, celebrating: true };

    turn();

    expect(yieldsAsked).eql(['a', 'b']);
    expect(events).eql([
      ['city:civil-disorder', a],
      ['city:leader-celebration', b],
    ]);
    expect(cityStatus(UPSET, a, pendingEffects)).not.null;
    expect(cityStatus(CHEERFUL, b, pendingEffects)).not.null;

    events.length = 0;
    state.a = { disorder: false, celebrating: false };
    state.b = { disorder: false, celebrating: false };

    turn();

    expect(events).eql([
      ['city:order-restored', a],
      ['city:celebration-ended', b],
    ]);
    expect(pendingEffects.entries()).empty;
  });

  it('calls the hooks with the check, telling a second turn running from a first', (): void => {
    const { state, a, b, turn } = setUp(),
      continued: City[] = [],
      checked: [City, boolean][] = [];

    state.a = { disorder: true, celebrating: false };
    state.b = { disorder: false, celebrating: true };

    const hooks = {
      onDisorderContinues: ({ city }: CityStatusCheck) => continued.push(city),
      onCelebrationChecked: ({ city }: CityStatusCheck, again: boolean) =>
        checked.push([city, again]),
    };

    turn(hooks);
    turn(hooks);

    expect(continued).eql([a]);
    expect(checked).eql([
      [a, false],
      [b, false],
      [a, false],
      [b, true],
    ]);
  });

  it('keeps a celebration through disorder only when the ruleset says so', (): void => {
    const { pendingEffects, events, state, a, turn } = setUp();

    state.a = { disorder: false, celebrating: true };
    state.b = { disorder: false, celebrating: false };

    turn();

    state.a = { disorder: true, celebrating: false };
    events.length = 0;

    turn({ celebrationSurvivesDisorder: true });

    expect(cityStatus(CHEERFUL, a, pendingEffects)).not.null;
    expect(events).eql([['city:civil-disorder', a]]);

    turn();

    expect(cityStatus(CHEERFUL, a, pendingEffects)).null;
    expect(events).eql([
      ['city:civil-disorder', a],
      ['city:civil-disorder', a],
      ['city:celebration-ended', a],
    ]);
  });

  it('drops a celebration without a word when the ruleset forgets it', (): void => {
    const { pendingEffects, events, state, a, turn } = setUp(),
      asked: boolean[] = [];

    state.a = { disorder: false, celebrating: true };
    state.b = { disorder: false, celebrating: false };

    turn();

    state.a = { disorder: true, celebrating: false };
    events.length = 0;

    turn({
      forgetCelebration: ({ disorder }: CityStatusCheck) => {
        asked.push(disorder);

        return disorder;
      },
    });

    expect(asked).eql([true]);
    expect(cityStatus(CHEERFUL, a, pendingEffects)).null;
    expect(events).eql([['city:civil-disorder', a]]);
  });
});
