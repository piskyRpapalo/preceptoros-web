//! acho-ledger · C8 holdings and wave life, as signed by the Sovereign on 2026-11-08.
//!
//! - **Garrison:** the winning squad stays to guard the building. Deployed waves cannot fight, so an account never holds more
//!   buildings than waves: the natural cap of the ephemeral account.
//! - **Raids:** every `raid_every` steps an NPC raids each held building; the garrison loses 10 % of its maximum life even
//!   when it wins. At zero the waves go back to the undeployed army; the building stands unguarded and the NPC retakes it
//!   after `retake_after` steps.
//! - **Resources:** copper, light, biomass, oxygen. Each building yields `base(kind) × life` per tick; each deployed wave
//!   eats one oxygen per tick (without oxygen the garrison loses 2 % per tick). Healing 10 % costs
//!   `ceil(25 × (1.1 − life))` copper plus 5 biomass.
//! - **Wave life:** each combat spends 5 % of a wave's life; waves heal per minute, full recovery in one hour (parameterized).
//! - **The ledger:** every change is an entry `{tick, building, resource, delta, rule}`, chained by SHA-256. A balance is the
//!   sum of its entries (conservation), so an A2A agent can replay it, verify it, or try to break it.
//!
//! Life is in per-mille (0..=1000) and every rule is integer arithmetic: the same numbers on every machine. No chance, no
//! clock: the caller passes the step count (and, for wave healing, the minutes of the visit clock it declares).

pub mod sha256;
pub mod wasm;

/// The four resources, in the order of the game's state vector (state_vector.js `r`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Resource { Copper = 0, Light = 1, Biomass = 2, Oxygen = 3 }
pub const RESOURCES: [Resource; 4] = [Resource::Copper, Resource::Light, Resource::Biomass, Resource::Oxygen];
impl Resource {
    pub fn name(self) -> &'static str { ["copper", "light", "biomass", "oxygen"][self as usize] }
}

/// The signed rules. Every number the Sovereign said «we will adjust later» lives here and nowhere else.
#[derive(Clone, Debug)]
pub struct Rules {
    pub raid_every: u64,          // steps between raids (the clock is steps walked)
    pub raid_damage: u32,         // per-mille of maximum life lost per raid, even on a win (100 = 10 %)
    pub retake_after: u64,        // steps an unguarded building waits before the NPC retakes it
    pub upkeep_oxygen: i64,       // oxygen per deployed wave per tick
    pub starve_damage: u32,       // per-mille lost per tick without oxygen (20 = 2 %)
    pub heal_step: u32,           // per-mille healed by one heal (100 = 10 %)
    pub heal_copper_base: i64,    // ceil(base × (1.1 − life)) copper per heal
    pub heal_biomass: i64,        // biomass per heal
    pub combat_cost: u32,         // per-mille of a wave's life spent per combat (50 = 5 %)
    pub heal_full_minutes: u32,   // a wave recovers from 0 to full in this many minutes
}
impl Default for Rules {
    fn default() -> Self {
        Rules { raid_every: 20, raid_damage: 100, retake_after: 60, upkeep_oxygen: 1, starve_damage: 20, heal_step: 100,
                heal_copper_base: 25, heal_biomass: 5, combat_cost: 50, heal_full_minutes: 60 }
    }
}

/// What each building kind yields per tick at full life: [copper, light, biomass, oxygen]. Its role decides it.
pub fn base(kind: &str) -> [i64; 4] {
    match kind {
        "workshop" => [6, 0, 0, 0], "lottery" => [4, 1, 0, 0], "customs" => [3, 2, 0, 0],
        "hostel" => [0, 5, 0, 0], "tower" => [0, 4, 0, 1], "choir" => [0, 1, 0, 5],
        "agora" => [0, 0, 5, 0], "doctor" => [0, 0, 3, 2], "coliseum" => [2, 0, 0, 2], "visitor-house" => [1, 1, 1, 1],
        _ => [0, 0, 0, 0],
    }
}

/// Wave life: one combat's cost (never below zero).
pub fn after_combat(life: u32, r: &Rules) -> u32 { life.saturating_sub(r.combat_cost) }
/// Wave life: healing over `minutes` of the declared visit clock; a full recovery takes `heal_full_minutes`.
pub fn healed(life: u32, minutes: u32, r: &Rules) -> u32 {
    let gain = (1000u64 * minutes as u64).div_ceil(r.heal_full_minutes.max(1) as u64);
    (life as u64 + gain).min(1000) as u32
}
/// The copper of one heal at this life: ceil(base × (1.1 − life)), in exact per-mille arithmetic.
pub fn heal_copper(life: u32, r: &Rules) -> i64 {
    let gap = 1100 - life.min(1000) as i64; // (1.1 − life) in per-mille
    (r.heal_copper_base * gap + 999) / 1000
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Entry { pub tick: u64, pub building: String, pub resource: Resource, pub delta: i64, pub rule: &'static str, pub hash: String }

#[derive(Clone, Debug)]
pub struct Holding { pub building: String, pub kind: String, pub waves: Vec<u32>, pub unguarded_since: Option<u64> }
impl Holding {
    /// The garrison's life: the mean of its waves (per-mille); zero when it has none.
    pub fn life(&self) -> u32 { if self.waves.is_empty() { 0 } else { (self.waves.iter().map(|&w| w as u64).sum::<u64>() / self.waves.len() as u64) as u32 } }
}

/// What a tick did, for the page to tell in words.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Event { Raided(String), Fell(String, usize), Retaken(String), Starved(String) }

pub struct Ledger { pub rules: Rules, pub entries: Vec<Entry>, pub holdings: Vec<Holding>, pub army: Vec<u32>, head: String }
impl Ledger {
    pub fn new(rules: Rules) -> Self { Ledger { rules, entries: vec![], holdings: vec![], army: vec![], head: "0".repeat(64) } }
    pub fn head(&self) -> &str { &self.head }

    /// The only door a resource changes through: an entry chained to the one before.
    pub fn post(&mut self, tick: u64, building: &str, resource: Resource, delta: i64, rule: &'static str) {
        let line = format!("{}|{}|{}|{}|{}|{}", self.head, tick, building, resource.name(), delta, rule);
        let hash = sha256::hex(line.as_bytes());
        self.head = hash.clone();
        self.entries.push(Entry { tick, building: building.to_string(), resource, delta, rule, hash });
    }
    /// A balance is the sum of its entries: there is no other store to drift from.
    pub fn balance(&self, r: Resource) -> i64 { self.entries.iter().filter(|e| e.resource == r).map(|e| e.delta).sum() }

    /// Grant from outside the holdings (quests, the beacon): it still goes through the ledger.
    pub fn grant(&mut self, tick: u64, r: Resource, amount: i64, why: &'static str) { self.post(tick, "-", r, amount, why); }

    /// A win: the winning waves become the garrison (they leave the army).
    pub fn conquer(&mut self, building: &str, kind: &str, waves: Vec<u32>) {
        self.holdings.retain(|h| h.building != building);
        self.holdings.push(Holding { building: building.into(), kind: kind.into(), waves, unguarded_since: None });
    }

    /// One heal of 10 % on a garrison, paid in copper and biomass; refused (None) when the purse cannot pay.
    pub fn heal(&mut self, tick: u64, building: &str) -> Option<u32> {
        let r = self.rules.clone();
        let i = self.holdings.iter().position(|h| h.building == building)?;
        let life = self.holdings[i].life();
        if self.holdings[i].waves.is_empty() || life >= 1000 { return None; }
        let copper = heal_copper(life, &r);
        if self.balance(Resource::Copper) < copper || self.balance(Resource::Biomass) < r.heal_biomass { return None; }
        self.post(tick, building, Resource::Copper, -copper, "heal");
        self.post(tick, building, Resource::Biomass, -r.heal_biomass, "heal");
        for w in self.holdings[i].waves.iter_mut() { *w = (*w + r.heal_step).min(1000); }
        Some(self.holdings[i].life())
    }

    /// One step of the world: production, upkeep, raids on the raid steps, the NPC retaking what stayed unguarded.
    pub fn tick(&mut self, step: u64) -> Vec<Event> {
        let r = self.rules.clone();
        let mut ev = vec![];
        let mut i = 0;
        while i < self.holdings.len() {
            let (b, kind, life, n) = { let h = &self.holdings[i]; (h.building.clone(), h.kind.clone(), h.life(), h.waves.len()) };
            if n == 0 {
                let since = *self.holdings[i].unguarded_since.get_or_insert(step);
                if step >= since + r.retake_after { self.holdings.remove(i); ev.push(Event::Retaken(b)); continue; }
                i += 1; continue;
            }
            for (k, res) in RESOURCES.iter().enumerate() {
                let yieldv = base(&kind)[k] * life as i64 / 1000;
                if yieldv > 0 { self.post(step, &b, *res, yieldv, "yield"); }
            }
            let need = r.upkeep_oxygen * n as i64;
            if self.balance(Resource::Oxygen) >= need { self.post(step, &b, Resource::Oxygen, -need, "upkeep"); }
            else { for w in self.holdings[i].waves.iter_mut() { *w = w.saturating_sub(r.starve_damage); } ev.push(Event::Starved(b.clone())); }
            if step > 0 && step % r.raid_every == 0 {
                for w in self.holdings[i].waves.iter_mut() { *w = w.saturating_sub(r.raid_damage); }
                ev.push(Event::Raided(b.clone()));
            }
            if self.holdings[i].life() == 0 {
                let back: Vec<u32> = self.holdings[i].waves.drain(..).collect();
                ev.push(Event::Fell(b.clone(), back.len()));
                self.army.extend(back);
                self.holdings[i].unguarded_since = Some(step);
            }
            i += 1;
        }
        ev
    }

    /// Replays the chain from zero: true only if every hash follows from the entries before it.
    pub fn verify(entries: &[Entry]) -> bool {
        let mut head = "0".repeat(64);
        for e in entries {
            let line = format!("{}|{}|{}|{}|{}|{}", head, e.tick, e.building, e.resource.name(), e.delta, e.rule);
            if sha256::hex(line.as_bytes()) != e.hash { return false; }
            head = e.hash.clone();
        }
        true
    }

    /// The ledger as JSON for benchmarks: entries, balances and the head. Hand-written: no dependencies.
    pub fn export(&self) -> String {
        let es: Vec<String> = self.entries.iter().map(|e| format!(
            "{{\"tick\":{},\"building\":\"{}\",\"resource\":\"{}\",\"delta\":{},\"rule\":\"{}\",\"hash\":\"{}\"}}",
            e.tick, e.building.replace('"', ""), e.resource.name(), e.delta, e.rule, e.hash)).collect();
        let bal: Vec<String> = RESOURCES.iter().map(|r| format!("\"{}\":{}", r.name(), self.balance(*r))).collect();
        format!("{{\"schema\":\"acho-ledger/1\",\"head\":\"{}\",\"balances\":{{{}}},\"entries\":[{}]}}", self.head, bal.join(","), es.join(","))
    }
}

#[cfg(test)]
mod tests;
