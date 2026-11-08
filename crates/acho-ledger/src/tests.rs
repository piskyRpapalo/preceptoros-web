use super::*;

#[test]
fn sha256_matches_the_standard_vectors() {
    assert_eq!(sha256::hex(b""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert_eq!(sha256::hex(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert_eq!(sha256::hex(&[b'a'; 1000]), "41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
}

#[test]
fn wave_life_spends_five_percent_per_combat_and_heals_fully_in_one_hour() {
    let r = Rules::default();
    assert_eq!(after_combat(1000, &r), 950);
    assert_eq!(after_combat(30, &r), 0);
    assert_eq!(healed(0, 60, &r), 1000);
    assert_eq!(healed(0, 30, &r), 500);
    assert_eq!(healed(990, 1, &r), 1000, "healing never passes full");
}

#[test]
fn heal_costs_more_the_more_it_hurts() {
    let r = Rules::default();
    assert_eq!(heal_copper(1000, &r), 3);  // ceil(25 × 0.1) = 3
    assert_eq!(heal_copper(500, &r), 15);  // ceil(25 × 0.6) = 15
    assert_eq!(heal_copper(0, &r), 28);    // ceil(25 × 1.1) = 28
}

#[test]
fn a_raid_costs_ten_percent_even_on_a_win_and_zero_sends_the_waves_home() {
    let mut l = Ledger::new(Rules::default());
    l.grant(0, Resource::Oxygen, 10_000, "test");
    l.conquer("b:workshop:3,1", "workshop", vec![150, 150]);
    let mut fell = None;
    for s in 1..=40 {
        for e in l.tick(s) { if let Event::Fell(_, n) = e { fell = Some((s, n)); } }
        if s == 20 { assert_eq!(l.holdings[0].waves, vec![50, 50], "one raid takes exactly 10 % of maximum life"); }
    }
    assert_eq!(l.holdings[0].waves.len(), 0);
    assert_eq!(fell, Some((40, 2)), "two raids of 10 % take 150 per-mille to zero on step 40");
    assert_eq!(l.army, vec![0, 0], "the waves go back to the undeployed army");
}

#[test]
fn the_npc_retakes_an_unguarded_building_after_sixty_steps() {
    let mut l = Ledger::new(Rules::default());
    l.conquer("b:agora:1,1", "agora", vec![]);
    let mut gone = None;
    for s in 1..=80 { if l.tick(s).contains(&Event::Retaken("b:agora:1,1".into())) { gone = Some(s); } }
    assert_eq!(gone, Some(61));
    assert!(l.holdings.is_empty());
}

#[test]
fn production_follows_life_and_upkeep_eats_oxygen() {
    let mut l = Ledger::new(Rules::default());
    l.grant(0, Resource::Oxygen, 5, "test");
    l.conquer("b:workshop:0,4", "workshop", vec![500]);
    l.tick(1);
    assert_eq!(l.balance(Resource::Copper), 3, "workshop yields 6 × 0.5");
    assert_eq!(l.balance(Resource::Oxygen), 4);
}

#[test]
fn without_oxygen_the_garrison_starves() {
    let mut l = Ledger::new(Rules::default());
    l.conquer("b:hostel:2,2", "hostel", vec![1000]);
    assert!(l.tick(1).contains(&Event::Starved("b:hostel:2,2".into())));
    assert_eq!(l.holdings[0].waves[0], 980);
}

#[test]
fn heal_is_paid_or_refused() {
    let mut l = Ledger::new(Rules::default());
    l.conquer("b:doctor:5,5", "doctor", vec![500]);
    assert_eq!(l.heal(1, "b:doctor:5,5"), None, "an empty purse cannot heal");
    l.grant(1, Resource::Copper, 15, "quest");
    l.grant(1, Resource::Biomass, 5, "quest");
    assert_eq!(l.heal(2, "b:doctor:5,5"), Some(600));
    assert_eq!(l.balance(Resource::Copper), 0);
    assert_eq!(l.balance(Resource::Biomass), 0);
}

#[test]
fn the_chain_verifies_and_any_forged_entry_breaks_it() {
    let mut l = Ledger::new(Rules::default());
    l.grant(0, Resource::Oxygen, 100, "beacon");
    l.conquer("b:choir:1,2", "choir", vec![1000, 800]);
    for s in 1..=25 { l.tick(s); }
    assert!(Ledger::verify(&l.entries));
    let mut forged = l.entries.clone();
    forged[3].delta += 1_000_000; // a resource created outside the rules
    assert!(!Ledger::verify(&forged), "a forged delta must break the chain");
    let total: i64 = l.entries.iter().filter(|e| e.resource == Resource::Oxygen).map(|e| e.delta).sum();
    assert_eq!(total, l.balance(Resource::Oxygen), "conservation: a balance is its entries");
    assert!(l.export().starts_with("{\"schema\":\"acho-ledger/1\",\"head\":\""));
}

#[test]
fn the_same_inputs_give_the_same_head() {
    let run = || { let mut l = Ledger::new(Rules::default()); l.grant(0, Resource::Oxygen, 50, "b"); l.conquer("b:tower:0,0", "tower", vec![700]); for s in 1..=30 { l.tick(s); } l.head().to_string() };
    assert_eq!(run(), run());
}

#[test]
fn wasm_abi_round_trip() {
    use crate::wasm::*;
    ledger_reset();
    ledger_grant(3, 100, 0);
    assert_eq!(ledger_conquer(7, 0, 2, 1000), 1);
    let mask = ledger_tick(1);
    assert_eq!(mask & 8, 0, "no starvation with oxygen in the purse");
    assert_eq!(ledger_balance(0), 6);
    assert_eq!(ledger_count(), 1);
    assert_eq!((ledger_holding_id(0), ledger_holding_kind(0), ledger_holding_waves(0), ledger_holding_life(0)), (7, 0, 2, 1000));
    assert_eq!(ledger_verify(), 1);
    assert_eq!(ledger_conquer(8, 99, 1, 1000), 0, "a kind outside the table is refused");
}
