# AMOR RPG — El valle del león

Alfa 06 de un RPG 3D táctil, derivado del jardín mobile. Es de **un jugador**: todavía no implementa servidor, cuentas, chat ni multijugador. Proyecto personal independiente.

## Jugar

Mantener el dedo y desplazarlo ligeramente mueve al personaje; soltar lo detiene. Un toque breve elige un destino u objeto. También funciona con mouse.

- Tocá un árbol, roca o veta: se acerca y recolecta hasta agotar el nodo. Regeneración en 22 segundos de juego.
- Tocá un león o el acceso Leones: combate automático con la espada equipada. Cinco leones patrullan, persiguen y atacan fuera del pueblo. Reaparecen tras 30 segundos.
- Cada león da 30 XP; el cuero, oro y colmillo entran automáticamente a la mochila; no aparecen bolsas en el suelo.
- En el taller, mejorá la espada con 6 de madera, 4 de piedra, 3 de oro y 2 de cuero. Cada mejora aumenta el costo y agrega 7 de daño, hasta +10. El escudo de dragón se fabrica más adelante.
- El pueblo regenera vida; la posada la restaura. Al caer, reaparecés sin perder objetos ni experiencia.
- La misión inicial pide los recursos para mejorar la espada; cada paso nuevo abre un cartel grande.
- El progreso se guarda en localStorage. Las posiciones de enemigos y nodos se reinician al recargar. Los paneles y las pestañas ocultas pausan el mundo.

## Ejecutar localmente

```sh
python3 -m http.server 8081
```

Abrir http://localhost:8081. Sin instalación ni compilación; Three.js está incluido con su licencia MIT. Las fuentes web son opcionales.

## Verificación

```sh
node --check game.js
node core.test.cjs
```

`core.js` separa experiencia, progresión, inventario, receta y validación del guardado. `world.js` reutiliza los constructores geométricos del prototipo mobile; `game.js` implementa escena, navegación, combate e interacción.

Las versiones originales de AMOR y mobile se conservan en sus carpetas y repositorio independientes. No se incluyen imágenes de productos en esta alfa.

## Puente y bosque de osos

En el taller se construye una vez por 20 de madera, 12 de piedra y 10 de oro. Abre un camino físico y transitable hacia una segunda isla. Los tres osos tienen 360 PV y hacen 25 de daño; recomiendan espada +5 (por debajo reciben 1 de daño por golpe). Otorgan 100 XP, 3 cueros, 6 de oro y 2 colmillos automáticamente. Reaparecen tras 45 segundos. Tanto al cargar como al caer, el jugador aparece en el pueblo inicial. Las partidas anteriores conservan su progreso.

El registro de actividad se muestra arriba a la derecha; las misiones abren un cartel y los números de daño flotan sobre cada combatiente. Pruebas adicionales: `node expansion.test.cjs`.

## Interfaz alfa 03

Texto de interfaz ampliado 1,5× en ambas orientaciones; las etiquetas 3D conservan su tipografía. Recolección y recompensas aparecen en el registro superior derecho. El objetivo seleccionado flota arriba al centro. Los botones de interacción son mayores y la cámara compensa la menor altura del teléfono horizontal, conservando la escala vertical original.

## Alfa 05 — recursos, dragones y escudo

- Los objetivos piden cantidades de recursos, sin requisitos de tandas: mercado por 30 colmillos de oso; Don Tito recibe 15 quesos y 240 frutos. El queso aparece abajo.
- Un cartel grande anuncia cada paso nuevo. Se guarda el último cartel confirmado para no repetirlo al recargar.
- La entrega a Don Tito abre un camino físico al sureste y el primer dragón (1100 PV, 48 de daño, 240 XP, 1 piel y 20 oro). Espada recomendada +10; cualquier espada permite seleccionarlo y combatir, pero por debajo hace solo 1 de daño por golpe. Lo mismo aplica a osos con +5.
- La primera piel se consume en el taller para fabricar y equipar un escudo visible. Reduce el daño recibido un 70%, redondeado a entero. Aparecen cinco dragones; cada uno vuelve a aparecer tras 30 segundos.
- El taller pide 10 pieles adicionales. Entregarlas consume los recursos una sola vez y completa los encargos; el juego continúa.
- Daño causado en verde y recibido en rojo, grande y proyectado sobre el objetivo, con desvanecimiento de 0,85 segundos.
- La selección automática responde a ataques solo si no hay otro enemigo seleccionado; un toque permite cambiar el objetivo.
- El taller cierra por botón, Escape o toque exterior. Se mantienen joystick, recursos automáticos, reaparición en el pueblo y partidas anteriores. Una partida que había terminado el encargo de Don Tito continúa directamente con el dragón.
- Las pruebas locales usan una copia temporal y partidas de prueba, sin alterar el progreso del navegador público.

Pruebas: `node core.test.cjs`, `node progression.test.cjs`, `node expansion.test.cjs`, `node dragon.test.cjs`.

## Alfa 06 — vista despejada

Los accesos de viaje, enemigos y recolección están en un solo botón «Acciones». El desplegable se cierra al elegir una acción, tocar afuera o presionar Escape. El toque exterior solo cierra el menú; no mueve al personaje. Ya no hay hilera inferior de objetos: el inventario completo sigue en «Mochila», arriba. La vida sobre el personaje muestra PV, espada y escudo en una línea y una barra compacta, conservando la tipografía y los valores reales. El joystick y la interacción cercana aprovechan el espacio inferior libre.

Alfa 06b: 10 ratas por tanda y 8 arbustos de frutos silvestres (48 frutos por recolección completa). Los objetivos siguen pidiendo 15 quesos y 240 frutos.

## Quests y códigos

QUESTS, junto a VALLE · ALFA 06, abre tarjetas con scroll: completadas oscuras, actual destacada y futuras bloqueadas. Acciones → Código acepta NIVEL10 y guarda la espada +10 sin cambiar nivel, recursos ni desbloqueos. Don Tito espera en un claro al fondo del bosque de osos (0, −46), libre de los árboles cercanos.
