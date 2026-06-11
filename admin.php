<?php
$catalogFile = __DIR__ . '/data/products.json';
$uploadRoot = __DIR__ . '/resources/products';
$message = '';

function slugify($value) {
  $value = strtolower(trim($value));
  $value = preg_replace('/[^a-z0-9]+/', '-', $value);
  return trim($value, '-') ?: 'item';
}

function loadCatalog($catalogFile) {
  if (!file_exists($catalogFile)) {
    return ['items' => []];
  }
  $json = file_get_contents($catalogFile);
  $data = json_decode($json, true);
  return is_array($data) && isset($data['items']) ? $data : ['items' => []];
}

function saveCatalog($catalogFile, $data) {
  file_put_contents($catalogFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

$catalog = loadCatalog($catalogFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $action = $_POST['action'] ?? '';
  $id = slugify($_POST['id'] ?? $_POST['name'] ?? '');

  if ($action === 'delete') {
    $catalog['items'] = array_values(array_filter($catalog['items'], fn($item) => ($item['id'] ?? '') !== $id));
    saveCatalog($catalogFile, $catalog);
    $message = 'Deleted item. Commit data/products.json manually for GitHub Pages.';
  } else {
    $name = trim($_POST['name'] ?? '');
    $type = $_POST['type'] === 'product' ? 'product' : 'service';
    $dir = $uploadRoot . '/' . $id;
    if (!is_dir($dir)) mkdir($dir, 0775, true);

    $existingImages = array_filter(array_map('trim', explode("\n", $_POST['existing_images'] ?? '')));
    $images = $existingImages;

    if (!empty($_FILES['images']['name'][0])) {
      foreach ($_FILES['images']['name'] as $idx => $originalName) {
        if ($_FILES['images']['error'][$idx] !== UPLOAD_ERR_OK) continue;
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) continue;
        $targetName = $id . '-' . (count($images) + 1) . '.' . $ext;
        $targetPath = $dir . '/' . $targetName;
        move_uploaded_file($_FILES['images']['tmp_name'][$idx], $targetPath);
        $images[] = 'resources/products/' . $id . '/' . $targetName;
      }
    }

    $item = [
      'id' => $id,
      'type' => $type,
      'name' => $name,
      'badge' => trim($_POST['badge'] ?? ''),
      'summary' => trim($_POST['summary'] ?? ''),
      'description' => trim($_POST['description'] ?? ''),
      'images' => array_values($images),
      'specs' => array_values(array_filter(array_map('trim', explode("\n", $_POST['specs'] ?? '')))),
      'cta' => trim($_POST['cta'] ?? 'Contact Us')
    ];

    $updated = false;
    foreach ($catalog['items'] as $idx => $existing) {
      if (($existing['id'] ?? '') === $id) {
        $catalog['items'][$idx] = $item;
        $updated = true;
        break;
      }
    }
    if (!$updated) $catalog['items'][] = $item;
    saveCatalog($catalogFile, $catalog);
    $message = 'Saved item. Commit data/products.json and uploaded images manually for GitHub Pages.';
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SensorMind Catalog Admin</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <main class="section">
    <div class="container">
      <div class="section-label">Catalog Admin</div>
      <h1>Products &amp; Services</h1>
      <p style="margin:1rem 0 2rem;">This PHP admin works on a local/PHP server. GitHub Pages will serve the committed <code>data/products.json</code> and repo images.</p>
      <?php if ($message): ?><p class="card" style="margin-bottom:2rem;"><?php echo htmlspecialchars($message); ?></p><?php endif; ?>

      <form class="form contact-form-wrap" method="post" enctype="multipart/form-data" style="margin-bottom:2rem;">
        <input type="hidden" name="action" value="save" />
        <div class="form-row">
          <div class="form-group"><label>ID / Slug</label><input name="id" placeholder="prehri" /></div>
          <div class="form-group"><label>Type</label><select name="type"><option value="product">Product</option><option value="service">Service</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Name</label><input name="name" required /></div>
          <div class="form-group"><label>Badge</label><input name="badge" /></div>
        </div>
        <div class="form-group"><label>Summary</label><textarea name="summary"></textarea></div>
        <div class="form-group"><label>Description</label><textarea name="description"></textarea></div>
        <div class="form-group"><label>Specs, one per line</label><textarea name="specs"></textarea></div>
        <div class="form-group"><label>Existing image paths, one per line</label><textarea name="existing_images"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>CTA</label><input name="cta" placeholder="Request Quote" /></div>
          <div class="form-group"><label>Upload Images</label><input type="file" name="images[]" multiple accept="image/*" /></div>
        </div>
        <button class="btn btn-primary" type="submit">Save Item</button>
      </form>

      <div class="products-grid">
        <?php foreach ($catalog['items'] as $item): ?>
          <div class="card">
            <h3><?php echo htmlspecialchars($item['name'] ?? 'Untitled'); ?></h3>
            <p><?php echo htmlspecialchars($item['summary'] ?? ''); ?></p>
            <form method="post">
              <input type="hidden" name="action" value="delete" />
              <input type="hidden" name="id" value="<?php echo htmlspecialchars($item['id'] ?? ''); ?>" />
              <button class="btn btn-outline btn-sm" type="submit">Delete</button>
            </form>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </main>
</body>
</html>
