# AMOR RPG — El valle del león

Alfa 02 de un RPG 3D táctil, derivado del jardín mobile. Es de **un jugador**: todavía no implementa servidor, cuentas, chat ni multijugador. Proyecto personal independiente.

## Jugar

Mantener el dedo y desplazarlo ligeramente mueve al personaje; soltar lo detiene. Un toque breve elige un destino u objeto. También funciona con mouse.

- Tocá un árbol, roca o veta: se acerca y recolecta hasta agotar el nodo. Regeneración en 22 segundos de juego.
- Tocá un león o el acceso Leones: combate automático con la espada equipada. Cinco leones patrullan, persiguen y atacan fuera del pueblo. Reaparecen tras 30 segundos.
- Cada león da 30 XP; el cuero, oro y colmillo entran automáticamente a la mochila; no aparecen bolsas en el suelo.
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

## Puente y bosque de osos

En el taller se construye una vez por 20 de madera, 12 de piedra y 10 de oro. Abre un camino físico y transitable hacia una segunda isla. Los tres osos tienen 360 PV y hacen 25 de daño; exigen espada +5. Otorgan 100 XP, 3 cueros, 6 de oro y 2 colmillos automáticamente. Reaparecen tras 45 segundos. Tanto al cargar como al caer, el jugador aparece en el pueblo inicial. Las partidas anteriores conservan su progreso.

Todos los avisos se muestran arriba a la derecha. Pruebas adicionales: `node expansion.test.cjs`.

## Interfaz alfa 03

Texto de interfaz ampliado 1,5× en ambas orientaciones; las etiquetas 3D conservan su tipografía. Recolección y recompensas aparecen en el registro superior derecho. El objetivo seleccionado flota arriba al centro. Los botones de interacción son mayores y la cámara compensa la menor altura del teléfono horizontal, conservando la escala vertical original.
