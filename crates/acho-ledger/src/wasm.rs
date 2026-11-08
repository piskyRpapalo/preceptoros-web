//! WASM ABI of the one global ledger (contract «Buildings owned», 2026-11-08). Every export takes and returns i32/u32.
//! Holdings are keyed `b:<id>`; kinds are the index of `KINDS`; resources are the index of `RESOURCES`.

use crate::{heal_copper, Event, Holding, Ledger, Resource, Rules, RESOURCES};
use std::cell::RefCell;

const KINDS: [&str; 10] = ["workshop", "lottery", "customs", "hostel", "tower", "choir", "agora", "doctor", "coliseum", "visitor-house"];

thread_local! {
    static BOOK: RefCell<Ledger> = RefCell::new(Ledger::new(Rules::default()));
}

fn book<T>(f: impl FnOnce(&mut Ledger) -> T) -> T { BOOK.with(|b| f(&mut b.borrow_mut())) }
fn held<T: Default>(i: u32, f: impl FnOnce(&Holding) -> T) -> T { book(|l| l.holdings.get(i as usize).map(f).unwrap_or_default()) }
fn res(r: u32) -> Option<Resource> { RESOURCES.get(r as usize).copied() }

#[no_mangle]
pub extern "C" fn ledger_reset() { book(|l| *l = Ledger::new(Rules::default())) }

#[no_mangle]
pub extern "C" fn ledger_grant(r: u32, amount: i32, step: u32) {
    if let Some(x) = res(r) { book(|l| l.grant(step as u64, x, amount as i64, "grant")) }
}

#[no_mangle]
pub extern "C" fn ledger_conquer(id: u32, kind: u32, waves: u32, life: u32) -> u32 {
    let Some(k) = KINDS.get(kind as usize) else { return 0 };
    let n = waves.min(1000) as usize; // decisión mía (sin firma): tope de ondas para no reventar la memoria
    book(|l| l.conquer(&format!("b:{id}"), k, vec![life.min(1000); n]));
    1
}

#[no_mangle]
pub extern "C" fn ledger_tick(step: u32) -> u32 {
    book(|l| l.tick(step as u64)).iter().fold(0, |m, e| {
        m | match e {
            Event::Raided(_) => 1,
            Event::Fell(..) => 2,
            Event::Retaken(_) => 4,
            Event::Starved(_) => 8,
        }
    })
}

#[no_mangle]
pub extern "C" fn ledger_heal(step: u32, id: u32) -> i32 {
    book(|l| l.heal(step as u64, &format!("b:{id}"))).map_or(-1, |v| v as i32)
}

#[no_mangle]
pub extern "C" fn ledger_heal_cost(life: u32) -> i32 { book(|l| heal_copper(life, &l.rules)) as i32 }

#[no_mangle]
pub extern "C" fn ledger_balance(r: u32) -> i32 { res(r).map_or(0, |x| book(|l| l.balance(x)) as i32) }

#[no_mangle]
pub extern "C" fn ledger_count() -> u32 { book(|l| l.holdings.len()) as u32 }

#[no_mangle]
pub extern "C" fn ledger_holding_id(i: u32) -> u32 {
    held(i, |h| h.building.strip_prefix("b:").and_then(|s| s.parse::<u32>().ok()).unwrap_or(0))
}

#[no_mangle]
pub extern "C" fn ledger_holding_kind(i: u32) -> u32 { held(i, |h| KINDS.iter().position(|k| *k == h.kind).unwrap_or(0) as u32) }

#[no_mangle]
pub extern "C" fn ledger_holding_life(i: u32) -> u32 { held(i, |h| h.life()) }

#[no_mangle]
pub extern "C" fn ledger_holding_waves(i: u32) -> u32 { held(i, |h| h.waves.len() as u32) }

#[no_mangle]
pub extern "C" fn ledger_army() -> u32 { book(|l| l.army.len()) as u32 }

#[no_mangle]
pub extern "C" fn ledger_entries() -> u32 { book(|l| l.entries.len()) as u32 }

#[no_mangle]
pub extern "C" fn ledger_head_byte(i: u32) -> u32 {
    if i >= 32 { return 0; }
    let a = 2 * i as usize;
    book(|l| u32::from_str_radix(&l.head()[a..a + 2], 16).unwrap_or(0))
}

#[no_mangle]
pub extern "C" fn ledger_verify() -> u32 { book(|l| Ledger::verify(&l.entries)) as u32 }
