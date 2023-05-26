import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas')
  private canvasRef: ElementRef;

  //* sphere Properties

  @Input() public rotationSpeedX: number = 0.05;
  @Input() public rotationSpeedY: number = 0.01;
  @Input() public size: number = 200;

  //* Stage Properties
  @Input() public fieldOfView: number = 4;
  @Input('nearClipping') public nearClippingPlane: number = 1;
  @Input('farClipping') public farClippingPlane: number = 2000;

  //? Helper Properties (Private Properties);

  private camera!: THREE.PerspectiveCamera;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private gltfLoader = new GLTFLoader();

  private geometry = new THREE.SphereGeometry(0.25, 16, 16);
  private material = new THREE.MeshStandardMaterial(0xFFFFFF);
  private sphere: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;

  private controls: OrbitControls;

  private tubular: THREE.Group = new THREE.Group();

  private assembleSpheres() {
    const protoSphere = new THREE.Mesh(this.geometry, this.material);
    protoSphere.castShadow = true;
    protoSphere.receiveShadow = true;

    // create clones of the protoSphere
    // and add each to the group
    for (let i = 0; i < 10; i += 0.05) {
      const sphere = protoSphere.clone();

      // position the spheres on around a circle
      sphere.position.x = Math.cos(3 * Math.PI * i);
      sphere.position.y = i;
      sphere.position.z = Math.sin(3 * Math.PI * i);
      // sphere.scale.multiplyScalar(0.5);

      this.tubular.add(sphere);
    }

    this.scene.add(this.tubular);
  }

  /**
   * Create the scene
   *
   * @private
   * @memberof AppComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xFFFFFF)

    this.assembleSpheres();

    // this.gltfLoader.load('/assets/hamburger.glb', (gltf) => {
    //   this.scene.add(gltf.scene)
    //   const light = new THREE.AmbientLight( 0x404040, 4 ); // soft white light
    //   this.scene.add( light );
    // });

    //Create a PointLight and turn on shadows for the light
    const pointLight: THREE.PointLight = new THREE.PointLight( 0x34A4E8, 1, 100 );
    pointLight.position.set( 0, 25, 0 );
    pointLight.castShadow = true; // default false

    const pointLight2: THREE.PointLight = new THREE.PointLight( 0xF857A6, 2.5, 100 );
    pointLight2.position.set( 25, 0, 0 );
    pointLight2.castShadow = true; // default false

    const pointLight3: THREE.PointLight = new THREE.PointLight( 0x10BF70, 2.5, 100 );
    pointLight3.position.set( -25, 0, 30 );
    pointLight3.castShadow = true; // default false

    const pointLight4: THREE.PointLight = new THREE.PointLight( 0xFF6900, 2.5, 100 );
    pointLight4.position.set( 0, 0, 0 );
    pointLight4.castShadow = true; // default false

    //Set up shadow properties for the light
    pointLight.shadow.mapSize.width = 512; // default
    pointLight.shadow.mapSize.height = 512; // default
    pointLight.shadow.camera.near = 0.5; // default
    pointLight.shadow.camera.far = 500; // default
    // pointLight.shadowMapVisible = true;

    this.scene.add( pointLight );
    this.scene.add( pointLight2 );
    this.scene.add(pointLight3);
    this.scene.add(pointLight4);

    const pointLightHelper = new THREE.PointLightHelper( pointLight3, 1 );
    this.scene.add( pointLightHelper );  

    // const ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.1 ); // soft white light
    // this.scene.add( ambientLight );

    //*Camera
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPlane,
      this.farClippingPlane
    )
    this.camera.position.z = 0;
    this.camera.position.y = 30;
    this.camera.position.x = 0;

    var point = new THREE.Vector3( 0, 10, 0 );

    this.camera.lookAt( point );

    //this.camera.lookAt(new THREE.Vector3(0, 10, 0));
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private animateTube() {
    this.tubular.rotation.y += 0.005;
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
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, shadowMap: {enabled: true, type: THREE.PCFSoftShadowMap} });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    // this.controls = new OrbitControls( this.camera, this.renderer.domElement );

    let component: AppComponent = this;
    (function render() {
      requestAnimationFrame(render);
      component.animateTube();
      component.renderer.render(component.scene, component.camera);
      // this.controls.update();
    }());
  }

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.createScene();
    this.startRenderingLoop();
  }
}
