import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input, HostListener } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AUTO_STYLE, animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('collapse', [
      state(
        'false',
        style({
          height: AUTO_STYLE,
          opacity: 1,
          visibility: AUTO_STYLE,
        })
      ),
      state('true', style({height: '0', opacity: 0, visibility: 'hidden'})),
      transition('false => true', animate(300 + 'ms ease-in')),
      transition('true => false', animate(300 + 'ms ease-out')),
    ]),
  ],
})

export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') private canvasRef: ElementRef;

  //* Stage Properties
  @Input() public fieldOfView: number = 3;
  @Input('nearClipping') public nearClippingPlane: number = 0.1;
  @Input('farClipping') public farClippingPlane: number = 2000;

  mouseCoords = { 
    x: 0, 
    y: 0 
  };

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseCoords = this.getMousePos(event);
  }

  @HostListener('window:resize', ['$event'])
  onResizeWindow(event: UIEvent) {
    console.log(event);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = this.getAspectRatio();

    if(window.innerWidth > 768) {
      this.camera.zoom = 1.1;
      this.scene.children[1].position.x = 1.55;
      this.scene.children[1].position.z = 1.55;
      this.scene.children[1].position.y = 0;
      this.canvas.width = width * aspectRatio;
      this.canvas.height = height * aspectRatio;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.renderer.setSize(width, height);
      this.camera.left = - this.fieldOfView * aspectRatio;
      this.camera.right = this.fieldOfView * aspectRatio;
    } else {
      this.camera.zoom = 0.6;
      this.scene.children[1].position.x = 0;
      this.scene.children[1].position.z = 0;
      this.scene.children[1].position.y = 0.75;
    }

    this.camera.updateProjectionMatrix();
  }

  //? Helper Properties (Private Properties);
  private camera!: THREE.PerspectiveCamera;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  private gltfLoader = new GLTFLoader();
  private dracoLoader = new DRACOLoader();

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private islandObj;

  private controls: OrbitControls;

  makuExpand = false;

  isLoaded = false;

  /**
   * Create the scene
   *
   * @private
   * @memberof AppComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();

    // Env
    const hdrUrl = 'assets/images/gradient.hdr'
    new RGBELoader().load(hdrUrl, texture => {
      const gen = new THREE.PMREMGenerator(this.renderer)
      const envMap = gen.fromEquirectangular(texture).texture
      this.scene.environment = envMap;
      
      texture.dispose()
      gen.dispose()
    })

    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.dracoLoader.preload();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.gltfLoader.load('/assets/renae_island/renae_island_baking.gltf', (gltf) => {
      gltf.scene.traverse( function( node ) {
        if (node.isGroup) {
          node.children.forEach(child => {
            if (child.isMesh || child.isObject3D) {
              child.castShadow = true;
            }
          })
        } else if(node.isMesh || node.isObject3D) {
          if(node.name === 'Floor') {
            node.receiveShadow = true;
          } else {
            node.castShadow = true;
          }
        }
      } );

      // Offset for desktop+ sizes
      if(window.innerWidth > 768) {
        gltf.scene.position.x = 1.55;
        gltf.scene.position.z = 1.55;
      } else {
        gltf.scene.position.y = 0.75;
      }

      this.islandObj = gltf.scene;

      this.scene.add(this.islandObj);

      if(window.innerWidth > 768) {
        this.camera.zoom = 1.1;
      } else {
        this.camera.zoom = 0.6;
      }

      this.camera.updateProjectionMatrix();

      this.isLoaded = true;
    });

    //Create a DirectionalLight and turn on shadows for the light
    const directionLight: THREE.DirectionalLight = new THREE.DirectionalLight( 0xFFFFFF, 3);
    directionLight.position.set( -2, 10, -2 );
    directionLight.castShadow = true; // default false 

    //Set up shadow properties for the light
    directionLight.shadow.mapSize.width = 512; // default
    directionLight.shadow.mapSize.height = 512; // default
    directionLight.shadow.camera.near = 0.5; // default
    directionLight.shadow.camera.far = 1000;
    directionLight.shadow.bias = -0.0001;

    this.scene.add( directionLight );

    //*Camera
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.OrthographicCamera(
      - this.fieldOfView * aspectRatio,
      this.fieldOfView * aspectRatio,
      this.fieldOfView, - this.fieldOfView,
      this.nearClippingPlane,
      this.farClippingPlane
    )

    this.camera.position.set(5, 8, -5);
  }

  rgb(r, g, b) {
    return new THREE.Vector3(r, g, b);
  }

  private getAspectRatio() {
    return this.canvas?.clientWidth / this.canvas?.clientHeight;
  }

  /**
 * Start the rendering loop
 *
 * @private
 * @memberof AppComponent
 */
  private startRenderingLoop() {
    //* Renderer
    // Use canvas element in template
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(devicePixelRatio);
    //this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setSize(this.canvas?.clientWidth, this.canvas?.clientHeight);
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableRotate = false;

    console.log(window.innerWidth)
    if (window.innerWidth < 768) {
      this.mouseCoords.x = 1200;
    }

    let component: AppComponent = this;
    (function render() {
      requestAnimationFrame(render);
      if(!component.scene.children[1]) {
        return;
      }

      component.scene.children[1].rotation.y = THREE.MathUtils.lerp(component.scene.children[1]?.rotation.y, (component.mouseCoords.x * Math.PI) / 10000 - 0.5, 0.05)
      component.renderer.render(component.scene, component.camera);
      component.controls.update();
    }());
  }

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.createScene();
    this.startRenderingLoop();
  }

  private getMousePos(event: MouseEvent) {
    return { x: event.clientX, y: event.clientY };
  }

  toggleMakuCollapse() {
    this.makuExpand = !this.makuExpand;
  }

  goToGithub() {
    window.open('https://github.com/renaem');
  }

  goToLinkedIn() {
    window.open('https://www.linkedin.com/in/renaemeines/');
  }
}
