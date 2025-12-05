// Estado inicial
const initialState = {
  inflacion: 50,    // %
  desempleo: 8,     // %
  deficit: 4,       // % PIB
  confianza: 30,    // 0–100
  reservas: 60,     // 0–100
  energia: 40,      // 0–100
  log: []
};

// Utilidad: clamp
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

// Nodos del árbol (7 decisiones avanzadas mínimo)
// Cada nodo define narrativa, conceptos y opciones con efectos y siguiente nodo
const nodes = {
  N1: {
    title: "Escenario 0: Crisis multifacética",
    narrative:
      "Prosperitia enfrenta inflación del 50%, desabasto de energía y una huelga de transportistas. Tu primera decisión como Ministro:",
    concepts: ["Escasez", "Costo de oportunidad", "Incentivos", "Trade-offs"],
    choices: [
      {
        label: "A) Controlar precios de la canasta básica",
        effects: { inflacion: -5, confianza: -10, energia: -5 },
        next: "N2A",
        log: "Control de precios aplicado."
      },
      {
        label: "B) Subir la tasa de interés para frenar la inflación",
        effects: { inflacion: -15, desempleo: +3, confianza: -5, reservas: +5 },
        next: "N3B",
        log: "Tasa de interés elevada."
      },
      {
        label: "C) Negociar con transportistas subsidiando el diésel",
        effects: { inflacion: -3, deficit: +2, confianza: +5, energia: +10 },
        next: "N4C",
        log: "Subsidio al diésel negociado."
      }
    ]
  },

  // Consecuencia de A: desabasto y mercado negro
  N2A: {
    title: "Desabasto y mercado negro",
    narrative:
      "El control de precios genera desabasto y mercado negro. ¿Cómo respondes?",
    concepts: ["Incentivos", "Intervención estatal", "Trade-offs"],
    choices: [
      {
        label: "A2.1) Racionamiento y logística estatal",
        effects: { confianza: -5, energia: +5, inflacion: -3 },
        next: "N5D",
        log: "Racionamiento implementado."
      },
      {
        label: "A2.2) Levantar controles gradualmente + transferencias",
        effects: { confianza: +10, inflacion: +4, reservas: +2 },
        next: "N5D",
        log: "Controles levantados gradualmente; transferencias focalizadas."
      }
    ]
  },

  // Consecuencia de B: caen inversión y empleo
  N3B: {
    title: "Enfriamiento de la economía",
    narrative:
      "El alza de tasas frenó inversión y aumentó el desempleo. ¿Siguiente movimiento?",
    concepts: ["Costo de oportunidad", "Política monetaria vs. fiscal"],
    choices: [
      {
        label: "B3.1) Programa temporal de empleo público",
        effects: { desempleo: -2, deficit: +1, confianza: +5 },
        next: "N5D",
        log: "Empleo público temporal iniciado."
      },
      {
        label: "B3.2) Recorte de gasto corriente + reforma tributaria",
        effects: { deficit: -2, desempleo: +1, confianza: +3 },
        next: "N5D",
        log: "Ajuste fiscal con reforma tributaria."
      }
    ]
  },

  // Consecuencia de C: déficit y alivio logístico
  N4C: {
    title: "Subsidio con costos",
    narrative:
      "El subsidio al diésel mejora la logística, pero amplía el déficit. ¿Cómo lo gestionas?",
    concepts: ["Incentivos", "Sostenibilidad fiscal"],
    choices: [
      {
        label: "C4.1) Subsidio condicionado a productividad y metas",
        effects: { deficit: +1, confianza: +6, inflacion: -2 },
        next: "N5D",
        log: "Subsidio condicionado por metas de productividad."
      },
      {
        label: "C4.2) Retiro gradual del subsidio + reconversión energética",
        effects: { deficit: -1, energia: +10, confianza: +3 },
        next: "N5D",
        log: "Subsidio retirado gradualmente; reconversión energética."
      }
    ]
  },

  // Convergencia: expectativas inflacionarias persistentes
  N5D: {
    title: "Pacto de expectativas",
    narrative:
      "La inflación cede, pero las expectativas siguen altas. ¿Qué ancla nominal eliges?",
    concepts: ["Expectativas", "Acuerdos", "Independencia BC"],
    choices: [
      {
        label: "D5.1) Acuerdo de precios y salarios con metas de inflación",
        effects: { inflacion: -6, confianza: +8 },
        next: "N6E",
        log: "Acuerdo de precios y salarios firmado."
      },
      {
        label: "D5.2) Objetivo de inflación con independencia del banco central",
        effects: { inflacion: -8, confianza: +5, reservas: +5 },
        next: "N6E",
        log: "Régimen de metas de inflación adoptado."
      }
    ]
  },

  // Choque externo
  N6E: {
    title: "Choque externo: caída de exportaciones",
    narrative:
      "Se desploman los términos de intercambio y el tipo de cambio se deprecia.",
    concepts: ["Shock externo", "Política cambiaria", "Red de protección"],
    choices: [
      {
        label: "E6.1) Intervención cambiaria limitada",
        effects: { reservas: -10, inflacion: +2, confianza: +2 },
        next: "N7F",
        log: "Intervención cambiaria limitada."
      },
      {
        label: "E6.2) Flotación limpia + protección social",
        effects: { reservas: +0, inflacion: +3, confianza: +6, deficit: +1 },
        next: "N7F",
        log: "Flotación limpia y red de protección social."
      }
    ]
  },

  // Finales
  N7F: {
    title: "Resultados de política",
    narrative:
      "Evalúa el estado final: ¿control de recesión, hiperinflación o recuperación lenta?",
    concepts: ["Resultados", "Trade-offs", "Aprendizajes"],
    choices: [
      { label: "Ver resultado final", next: "END", effects: {}, log: "Cierre de simulación." }
    ]
  }
};

// Umbrales para finales
function computeEnding(state) {
  const { inflacion, desempleo, deficit, confianza, reservas, energia } = state;
  if (inflacion >= 80 || confianza <= 15) {
    return {
      title: "Final: Hiperinflación y caos social",
      detail:
        "Las anclas nominales se perdieron y la confianza colapsó. Se requieren reformas profundas.",
      cls: "bad"
    };
  }
  if (inflacion <= 15 && desempleo >= 12) {
    return {
      title: "Final: Recesión controlada",
      detail:
        "La inflación está baja, pero el desempleo es alto. Prioriza políticas de reactivación.",
      cls: "warn"
    };
  }
  if (inflacion <= 25 && confianza >= 55 && deficit <= 3 && reservas >= 50) {
    return {
      title: "Final: Recuperación lenta pero sostenida",
      detail:
        "Inflación moderada, confianza al alza y cuentas públicas contenidas. Ajustes graduales funcionan.",
      cls: "good"
    };
  }
  return {
    title: "Final: Estancamiento con estabilidad",
    detail:
      "Precios contenidos pero bajo crecimiento. Requiere productividad y inversión.",
    cls: "warn"
  };
}

// Render de indicadores
function renderIndicators(state) {
  const set = (id, val, suffix = "") =>
    (document.getElementById(id).textContent = `${val}${suffix}`);
  set("inflacion", `${state.inflacion}%`);
  set("desempleo", `${state.desempleo}%`);
  set("deficit", `${state.deficit}%`);
  set("confianza", state.confianza, "");
  set("reservas", state.reservas, "");
  set("energia", state.energia, "");
}

// Render de escena
function renderNode(nodeId, state) {
  const node = nodes[nodeId];
  document.getElementById("title").textContent = node.title;
  document.getElementById("narrative").textContent = node.narrative;
  const conceptsEl = document.getElementById("concepts");
  conceptsEl.innerHTML = "";
  node.concepts.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    conceptsEl.appendChild(li);
  });

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  node.choices.forEach(choice => {
    const card = document.createElement("div");
    card.className = "choice";
    const p = document.createElement("p");
    p.textContent = choice.label;
    const btn = document.createElement("button");
    btn.textContent = "Elegir";
    btn.addEventListener("click", () => {
      // Aplicar efectos
      Object.entries(choice.effects).forEach(([k, v]) => {
        state[k] = clamp(state[k] + v, k === "deficit" ? 0 : 0, 100);
      });
      state.log.push(choice.log);
      addLog(choice.log);
      renderIndicators(state);

      // Siguiente
      if (choice.next === "END") {
        showEnding(state);
      } else {
        renderNode(choice.next, state);
      }
    });
    card.appendChild(p);
    card.appendChild(btn);
    choicesEl.appendChild(card);
  });
}

// Log de decisiones
function addLog(text) {
  const li = document.createElement("li");
  li.textContent = text;
  document.getElementById("log").appendChild(li);
}

// Mostrar final
function showEnding(state) {
  const scene = document.getElementById("scene");
  const end = computeEnding(state);
  scene.innerHTML = `
    <h2 class="${end.cls}">${end.title}</h2>
    <p>${end.detail}</p>
    <p><strong>Trayectoria:</strong> Inflación ${state.inflacion}%, Desempleo ${state.desempleo}%, Déficit ${state.deficit}%, Confianza ${state.confianza}, Reservas ${state.reservas}, Energía ${state.energia}</p>
    <button id="restart2">Reiniciar</button>
  `;
  document.getElementById("restart2").addEventListener("click", () => restart());
}

// Reiniciar
function restart() {
  const state = JSON.parse(JSON.stringify(initialState));
  document.getElementById("log").innerHTML = "";
  renderIndicators(state);
  renderNode("N1", state);
}
document.getElementById("restart").addEventListener("click", restart);

// Init
restart();
