import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input, HostListener } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import anime from 'animejs/lib/anime.es.js';
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
  @ViewChild('cursor') private customCursor: ElementRef;
  @ViewChild('cursorCircle') private customCursorCircle: ElementRef;

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
    // this.setCursorPosition(event);
  }

  // @HostListener('mousedown', ['$event'])
  // onMouseDown(event: MouseEvent) {
  //   this.scaleCursor(event, 0.25);
  //   this.customCursorCircle.nativeElement.classList.add('animate');
  // }

  // @HostListener('mouseup', ['$event'])
  // onMouseUp(event: MouseEvent) {
  //   this.scaleCursor(event, 1);
  //   this.customCursorCircle.nativeElement.classList.remove('animate');
  // }

  //? Helper Properties (Private Properties);
  private camera!: THREE.PerspectiveCamera;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private gltfLoader = new GLTFLoader();
  private dracoLoader = new DRACOLoader();

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private islandObj;

  private controls: OrbitControls;

  makuExpand = false;

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

      gltf.scene.position.x = gltf.scene.position.x + 1.55;
      gltf.scene.position.z = gltf.scene.position.z + 1.55;

      this.islandObj = gltf.scene;

      this.scene.add(this.islandObj);
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

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
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
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableRotate = false;

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

  private setCursorPosition(event: MouseEvent) {
    let xPosition = event.clientX - this.customCursor.nativeElement.clientWidth / 2 + "px";
    let yPosition = event.clientY - this.customCursor.nativeElement.clientHeight / 2 + "px";
    this.customCursor.nativeElement.style.transform =
      "translate(" + xPosition + "," + yPosition + ") scale(1)";
    return {
      x: xPosition,
      y: yPosition
    };
  }

  private scaleCursor(e, scale) {
    this.setCursorPosition(e);
    this.customCursor.nativeElement.style.transform =
      "translate(" +
      this.setCursorPosition(e).x +
      "," +
      this.setCursorPosition(e).y +
      ") scale(" +
      scale +
      ")";
  };

  toggleMakuCollapse() {
    this.makuExpand = !this.makuExpand;
  }
}
