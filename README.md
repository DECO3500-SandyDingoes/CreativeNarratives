# Creative Narratives

**Creative Narratives** aims to investigate collaborative public art installations as a medium for supporting community narrative and awareness. We focus on designing a location specific experience to facilitate sharing of local stories and happenings. 

This repository contains the components of a functional evaluation prototype that can be either physicallay deployed at a location or demonstarted using a simulated environment.

## Documentation

Please visit the wiki pages for the [design process overview](https://github.com/DECO3500-SandyDingoes/CreativeNarratives/wiki/Design-Process-Overview), [technical specification](https://github.com/DECO3500-SandyDingoes/CreativeNarratives/wiki/Technical-Specification), [ethical considerations](https://github.com/DECO3500-SandyDingoes/CreativeNarratives/wiki/Ethical-Considerations), and [ongoing design documentation](https://github.com/DECO3500-SandyDingoes/CreativeNarratives/wiki/Ongoing-Design-Documentation).

## Repository Overview

This repository contains the source code for the **Creative Narratives** prototype. The prototype consists of three primary components, the editor, the serverless functions, and the installation.

- **Editor** (`/editor`) implements a web application designed to be accessed via mobile devices for the authoring and sharing of stories (content) to the installation. The editor is designed to be deployed to Cloudflare's pages platform.
- **Serverless functions** (`/functions`) implements a HTTP web API with endpoints used to post and retrieve stories (content) from the backend database. It also implements authentication and provides an endpoint for the **installation** the manage the rolling codes used for controlling access. The endpoints are implemented using the serverless [Cloudflare pages functions](https://developers.cloudflare.com/pages/functions/) API. The following resource bindings are required by the pages functions:
	- **KV namespace**
		- Name: `kv`
	- **D1 database**
		- Name: `db`
- **Installation** (`/installation`) implements a web application that fetches stories from the **serverless functions** web API, and then renders them either into a simulated scene or as output ready to be projected.
	- Depends on an API key defined in `/installation/src/.env.local` as `INSTALLATION_KEY` to gain read access to stories and set rolling codes. The API key must match the value defined in the **KV namespace** binding of the serverless API.
  
![A side by side view of the story editor on the left, the installation simulator in the middle, and the installation projector output on the right](/assets/preview.jpg "Overview of implemented interfaces")

## Build Instructions

***Node.js** and **NPM** must be installed for local development.*

The **editor** and **installation** allow for running locally via the following steps:

- **Install Dependencies**: To install dependencies run: `npm install`
- **Local Development:**
	- **Installation:** To start the local development server run: `npm -w installation run dev`
	- **editor:** To start the local development server run: `npm -w editor run dev`
- **Build for Production**
	- **Installation:** To start the local development server run: `npm -w installation run build`
	- **editor:** To start the local development server run: `npm -w editor run build`
