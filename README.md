# meetup_calendar
Script para generar un ics de todos los eventos de las comunidades de este repo publicados en meetup

# PreRequisitos

- Docker
- NodeJS (^v.18.5.0)

# Pasos

Instalar la imagen de docker [rotating-tor-http-proxy](https://github.com/zhaow-de/rotating-tor-http-proxy). Seguir instrucciones del repo.

1. levantar el proxy en local, una vez instalado:

```bash
docker run --rm -it -p 3128:3128 -p 4444:4444 -e "TOR_INSTANCES=5" -e "TOR_REBUILD_INTERVAL=3600" zhaowde/rotating-tor-http-proxy
```

2. Clonar este repo e instalar las dependencias de node

```bash
git clone https://github.com/Comunidades-Tecnologicas/meetup_calendar.git
cd meetup_calendar
npm install
```

3. Ejecutar el script

```bash
node index.js > calndario.ics
```

4. Importar el fichero "calendario.ics" generado en tu herramienta favorita.

5. FIN

