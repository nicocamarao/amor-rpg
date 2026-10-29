# AMOR RPG — El valle del león

Primera alfa de un RPG 3D táctil, derivado del jardín mobile. Es de **un jugador**: todavía no implementa servidor, cuentas, chat ni multijugador. Proyecto personal independiente.

## Jugar

Mantener el dedo y desplazarlo ligeramente mueve al personaje; soltar lo detiene. Un toque breve elige un destino u objeto. También funciona con mouse.

- Tocá un árbol, roca o veta: se acerca y recolecta hasta agotar el nodo. Regeneración en 22 segundos de juego.
- Tocá un león o el acceso Leones: combate automático con la espada equipada. Cinco leones patrullan, persiguen y atacan fuera del pueblo. Reaparecen tras 30 segundos.
- Cada león da 30 XP; su bolsa contiene cuero, oro y un colmillo. Tocá Recoger botín al acercarte.
- En el taller, mejorá la espada con 6 de madera, 4 de piedra, 3 de oro y 2 de cuero. Cada mejora aumenta el costo y agrega 7 de daño, hasta +5. Es el único equipo disponible.
- El pueblo regenera vida; la posada la restaura. Al caer, reaparecés sin perder objetos ni experiencia.
- La misión inicial pide derrotar 3 leones y mejorar la espada.
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
