# Creative Narratives Documentation

 A system that supports building a community narrative thorugh public art installations!

## Hurdles and Questions

 - [ ] Can we use the readme for documentation, or must we use the wiki?
     Wiki functionality is only available for public repos.

# Design Specification

==Design specification goes here...==

# Technical Specification

## Technology Stack

- Installation Hardware - components that constitute the physical installation.
	- ==display?==
	- ==compute?==
	- ==power, internet, enclosure / weather proofing?==
- User hardware - devices users to interact with the installation.
	- Mobile phone running Android or iOS from the last decade:
		- With support for QR code scanning,
		- And a WebRTC enabled web browser.
- Software - components used for the software implementation.
	- Inter-device connectivity will be provided via **WebRTC.**
	- Web based interfaces for both the installation and interactivity:
		- Components and state management using **React.**
		- ==rendering - depends on the visual design?==

### Installation Hardware

- Projection / screen?
- Compute? Raspberry pi?
- Power / internet / weather proofing?

### Application Framework

The installation application and interactivity application will both utilise web technologies for their implementations. In both cases, interfaces with relatively complex state and components will be required. To facilitate state management and and modularisation through components, we will adopt the **React** (https://react.dev/) framework. React was selected due to the broad range of supporting libraries, extensive documentation available, and the existing experience our team has using it. 

#### Installation Specific

==What tech is used specifically for the installation application?=

#### Interactivity Specific

==What tech is used specifically for the interactivity application?=

### Device connectivity

A connection has to be facilitated between the application running on the installation and the application running on devices of people who want to contribute. An ideal solution would provide a simple, widely supported, and low latency link. A few options have been investigated: HTTP requests, web sockets, and WebRTC.

HTTP provides a very simple request-response model of sending data to the installation, but would require a backend server, has higher latency compared to other options, and does not allow for simulations bi-directional communication. Web sockets upgrade the HTTP connection to allow for lower latency and simultaneous bi-directional communication. 

WebRTC is a low latency and peer-to-peer communication standard which is widely supported across devices and browsers. The peer-to-peer nature allows for us to forego having a backend server, and to instead allow direct connections from peoples' devices to the installation.

Therefore, WebRTC has been selected since it best aligns with the requirements of: increased simplicity by removing the need for a backend, support for low latency for user input and feedback, broad device support. Specifically, we will utilise WebRTC via peer.js (https://github.com/peers/peerjs) since it provides an easy to user API on top of the standard WebRTC API, resulting in reduced and simplified implementation work. 