class Observable {
  #subscribers = new Map(); 
  #middleware = [];
  #tokenCounter = 0;
 
  use(fn) {
    this.#middleware.push(fn);
    return this; 
  }
 
  subscribe(channel, handler) {
    const token = ++this.#tokenCounter;
    this.#subscribers.set(token, { channel, handler });
    return {
      token,
      unsubscribe: () => this.unsubscribe(token),
    };
  }
 
  once(channel, handler) {
    const sub = this.subscribe(channel, (payload) => {
      handler(payload);
      sub.unsubscribe();
    });
    return sub;
  }
 
  unsubscribe(token) {
    return this.#subscribers.delete(token);
  }
 
  emit(channel, payload) {
    let current = { channel, payload };
    for (const mw of this.#middleware) {
      current = mw(current) ?? current;
    }
 
    const { channel: ch, payload: p } = current;
    let called = 0;
 
    for (const [, sub] of this.#subscribers) {
      if (sub.channel === ch || sub.channel === "*") {
        try {
          sub.handler(p);
          called++;
        } catch (err) {
          this.emit("__error__", { channel: ch, payload: p, error: err });
        }
      }
    }
    return called; 
  }
 
  count(channel) {
    let n = 0;
    for (const [, sub] of this.#subscribers) {
      if (sub.channel === channel) n++;
    }
    return n;
  }
}
 
class ChatUser {
  #inbox = [];
  #sub = null;
 
  constructor(name, bus) {
    this.name = name;
    this.bus = bus;
  }
 
  joinChannel(channel) {
    this.#sub?.unsubscribe();
    this.#sub = this.bus.subscribe(channel, (msg) => {
      if (msg.from !== this.name) {
        this.#inbox.push(`[${channel}] ${msg.from}: ${msg.text}`);
      }
    });
    this.currentChannel = channel;
    return this;
  }
 
  leaveChannel() {
    this.#sub?.unsubscribe();
    this.#sub = null;
    this.currentChannel = null;
    return this;
  }
 
  send(text) {
    if (!this.currentChannel) throw new Error(`${this.name} не в каналі`);
    this.bus.emit(this.currentChannel, { from: this.name, text });
    return this;
  }
 
  getInbox() {
    return [...this.#inbox];
  }
 
  clearInbox() {
    this.#inbox = [];
  }
}
 
class LogBot {
  #log = [];
 
  constructor(bus) {
    bus.subscribe("*", (msg) => {
      if (msg && msg.from) {
        this.#log.push(`${msg.from} → ${msg.text}`);
      }
    });
  }
 
  getLog() {
    return [...this.#log];
  }
}