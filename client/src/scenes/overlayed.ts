import 'phaser';

export default abstract class OverlayedScene extends Phaser.Scene {
    protected overlay: Phaser.GameObjects.DOMElement;
    protected overlay_url: string;

    public constructor(config: Phaser.Types.Scenes.SettingsConfig, overlay_url: string) {
        super(config);
        this.overlay_url = overlay_url;
    }

    /** Always call super. */
    public preload() {
        this.load.html(`${this.scene.key}-overlay`, this.overlay_url);
    }

    /** Always call super. */
    public create() {
        this.overlay = this.add.dom(400, 300).createFromCache(`${this.scene.key}-overlay`);
        this.overlay.setPerspective(800);
        this.setup_overlay_fields();
        this.setup_overlay_behavior();
    }

    protected $(id: string) {
        return this.overlay.getChildByID(id);
    }

    protected abstract setup_overlay_behavior(): void;

    protected abstract setup_overlay_fields(): void;
}
