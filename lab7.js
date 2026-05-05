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
 