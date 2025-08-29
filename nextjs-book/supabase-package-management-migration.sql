-- Package Management Migration for Supabase
-- Custom Python Package Management System for LMS
-- Created: $(date)

-- ===================================
-- PACKAGE MANAGEMENT TABLES
-- ===================================

-- Python packages available in the system
CREATE TABLE python_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- package name (e.g., 'numpy', 'pandas')
    display_name TEXT NOT NULL, -- human readable name (e.g., 'NumPy', 'Pandas')
    description TEXT,
    category TEXT, -- 'data-science', 'visualization', 'web', 'ml', 'math', 'io', 'text'
    pyodide_compatible BOOLEAN DEFAULT TRUE, -- can be loaded via Pyodide
    install_via_micropip BOOLEAN DEFAULT FALSE, -- needs micropip instead of direct load
    version_constraint TEXT, -- e.g., ">=1.0.0", "~=2.1.0"
    documentation_url TEXT, -- link to package docs
    homepage_url TEXT, -- package homepage
    icon_url TEXT, -- package icon/logo
    tags TEXT, -- JSON array of additional tags
    is_active BOOLEAN DEFAULT TRUE,
    load_time_estimate INTEGER DEFAULT 1, -- estimated load time in seconds
    size_mb DECIMAL(10,2), -- approximate package size
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapter-specific package requirements
CREATE TABLE chapter_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES python_packages(id) ON DELETE CASCADE,
    required BOOLEAN DEFAULT TRUE, -- true = required, false = optional/suggested
    load_order INTEGER DEFAULT 0, -- order to load packages (0 = first)
    custom_import_name TEXT, -- custom alias for import (e.g., 'pd' for pandas)
    pre_import_code TEXT, -- code to run after package loads
    notes TEXT, -- instructor notes about why this package is needed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(chapter_id, package_id)
);

-- Organization package templates/sets
CREATE TABLE organization_package_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Data Science Basics', 'ML Advanced', 'Web Scraping'
    description TEXT,
    category TEXT, -- 'beginner', 'intermediate', 'advanced', 'specialized'
    icon TEXT, -- emoji or icon for the set
    is_default BOOLEAN DEFAULT FALSE, -- default set for new chapters
    is_public BOOLEAN DEFAULT FALSE, -- can other orgs use this template
    created_by UUID NOT NULL REFERENCES users(id),
    usage_count INTEGER DEFAULT 0, -- how many chapters use this set
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, name)
);

-- Items in package sets
CREATE TABLE package_set_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_set_id UUID NOT NULL REFERENCES organization_package_sets(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES python_packages(id) ON DELETE CASCADE,
    load_order INTEGER DEFAULT 0,
    required BOOLEAN DEFAULT TRUE,
    custom_import_name TEXT,
    pre_import_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(package_set_id, package_id)
);

-- Track package loading performance and issues
CREATE TABLE package_load_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    chapter_id UUID REFERENCES chapters(id),
    package_id UUID NOT NULL REFERENCES python_packages(id),
    load_time_ms INTEGER, -- actual load time in milliseconds
    success BOOLEAN NOT NULL,
    error_message TEXT, -- error if load failed
    user_agent TEXT, -- browser info
    pyodide_version TEXT, -- version of Pyodide used
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Package lookups
CREATE INDEX idx_python_packages_name ON python_packages(name);
CREATE INDEX idx_python_packages_category ON python_packages(category);
CREATE INDEX idx_python_packages_active ON python_packages(is_active);

-- Chapter package lookups
CREATE INDEX idx_chapter_packages_chapter ON chapter_packages(chapter_id);
CREATE INDEX idx_chapter_packages_load_order ON chapter_packages(chapter_id, load_order);

-- Package set lookups
CREATE INDEX idx_package_sets_org ON organization_package_sets(organization_id);
CREATE INDEX idx_package_sets_default ON organization_package_sets(organization_id, is_default);
CREATE INDEX idx_package_set_items_set ON package_set_items(package_set_id, load_order);

-- Performance tracking
CREATE INDEX idx_package_logs_chapter ON package_load_logs(chapter_id, created_at);
CREATE INDEX idx_package_logs_package ON package_load_logs(package_id, success);

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================

-- Enable RLS on all tables
ALTER TABLE python_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_package_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_load_logs ENABLE ROW LEVEL SECURITY;

-- Python packages - readable by all authenticated users
CREATE POLICY "Python packages are viewable by authenticated users"
ON python_packages FOR SELECT
TO authenticated
USING (is_active = true);

-- Only service role can manage python packages
CREATE POLICY "Only service role can manage python packages"
ON python_packages FOR ALL
TO service_role
USING (true);

-- Chapter packages - organization members can view/manage
CREATE POLICY "Chapter packages viewable by organization members"
ON chapter_packages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chapters c
        JOIN books b ON c.book_id = b.id
        JOIN users u ON u.organization_id = b.organization_id
        WHERE c.id = chapter_packages.chapter_id 
        AND u.id = auth.uid()
    )
);

CREATE POLICY "Instructors and above can manage chapter packages"
ON chapter_packages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chapters c
        JOIN books b ON c.book_id = b.id
        JOIN users u ON u.organization_id = b.organization_id
        WHERE c.id = chapter_packages.chapter_id 
        AND u.id = auth.uid()
        AND u.role IN ('OWNER', 'ADMIN', 'INSTRUCTOR')
    )
);

-- Organization package sets - organization members can view
CREATE POLICY "Package sets viewable by organization members"
ON organization_package_sets FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.organization_id = organization_package_sets.organization_id
        AND users.id = auth.uid()
    )
    OR is_public = true
);

CREATE POLICY "Instructors and above can manage package sets"
ON organization_package_sets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.organization_id = organization_package_sets.organization_id
        AND users.id = auth.uid()
        AND users.role IN ('OWNER', 'ADMIN', 'INSTRUCTOR')
    )
);

-- Package set items - follow parent package set permissions
CREATE POLICY "Package set items viewable with package set"
ON package_set_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organization_package_sets ops
        JOIN users u ON u.organization_id = ops.organization_id
        WHERE ops.id = package_set_items.package_set_id
        AND (u.id = auth.uid() OR ops.is_public = true)
    )
);

CREATE POLICY "Package set items manageable by instructors"
ON package_set_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organization_package_sets ops
        JOIN users u ON u.organization_id = ops.organization_id
        WHERE ops.id = package_set_items.package_set_id
        AND u.id = auth.uid()
        AND u.role IN ('OWNER', 'ADMIN', 'INSTRUCTOR')
    )
);

-- Package load logs - users can insert their own logs, organization admins can view all
CREATE POLICY "Users can log their own package loads"
ON package_load_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own package load logs"
ON package_load_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view all logs in their org"
ON package_load_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.organization_id = package_load_logs.organization_id
        AND users.id = auth.uid()
        AND users.role IN ('OWNER', 'ADMIN')
    )
);

-- ===================================
-- FUNCTIONS AND TRIGGERS
-- ===================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_python_packages_updated_at BEFORE UPDATE ON python_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapter_packages_updated_at BEFORE UPDATE ON chapter_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_sets_updated_at BEFORE UPDATE ON organization_package_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment package set usage count
CREATE OR REPLACE FUNCTION increment_package_set_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When a chapter uses a package set, increment usage count
        UPDATE organization_package_sets 
        SET usage_count = usage_count + 1
        WHERE id = NEW.package_set_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- When a chapter stops using a package set, decrement usage count
        UPDATE organization_package_sets 
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE id = OLD.package_set_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Note: We'll implement the trigger when we add chapter->package_set relationship

-- ===================================
-- INITIAL PACKAGE DATA SEED
-- ===================================

-- Core Python packages that are commonly available in Pyodide
INSERT INTO python_packages (name, display_name, description, category, pyodide_compatible, install_via_micropip, load_time_estimate, documentation_url) VALUES
-- Data Science Core
('numpy', 'NumPy', 'Fundamental package for scientific computing with Python', 'data-science', true, false, 2, 'https://numpy.org/doc/stable/'),
('pandas', 'Pandas', 'Powerful data structures and data analysis tools', 'data-science', true, false, 3, 'https://pandas.pydata.org/docs/'),
('scipy', 'SciPy', 'Scientific computing library with algorithms for optimization, linear algebra, integration, interpolation', 'data-science', true, false, 4, 'https://docs.scipy.org/doc/scipy/'),

-- Visualization
('matplotlib', 'Matplotlib', 'Comprehensive library for creating static, animated, and interactive visualizations', 'visualization', true, false, 3, 'https://matplotlib.org/stable/contents.html'),
('plotly', 'Plotly', 'Interactive graphing library for Python', 'visualization', true, true, 2, 'https://plotly.com/python/'),
('seaborn', 'Seaborn', 'Statistical data visualization based on matplotlib', 'visualization', true, true, 2, 'https://seaborn.pydata.org/'),

-- Machine Learning
('scikit-learn', 'Scikit-learn', 'Machine learning library featuring various classification, regression and clustering algorithms', 'ml', true, false, 5, 'https://scikit-learn.org/stable/'),

-- Web and HTTP
('requests', 'Requests', 'HTTP library for Python', 'web', true, true, 1, 'https://requests.readthedocs.io/'),
('beautifulsoup4', 'Beautiful Soup', 'Library for pulling data out of HTML and XML files', 'web', true, true, 1, 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/'),

-- Utilities
('datetime', 'DateTime', 'Basic date and time types', 'utilities', true, false, 0, 'https://docs.python.org/3/library/datetime.html'),
('json', 'JSON', 'JSON encoder and decoder', 'utilities', true, false, 0, 'https://docs.python.org/3/library/json.html'),
('re', 'Regular Expressions', 'Regular expression operations', 'text', true, false, 0, 'https://docs.python.org/3/library/re.html'),
('random', 'Random', 'Generate random numbers', 'utilities', true, false, 0, 'https://docs.python.org/3/library/random.html'),
('math', 'Math', 'Mathematical functions', 'math', true, false, 0, 'https://docs.python.org/3/library/math.html'),
('statistics', 'Statistics', 'Statistical functions', 'math', true, false, 0, 'https://docs.python.org/3/library/statistics.html'),

-- Text Processing
('nltk', 'NLTK', 'Natural Language Toolkit', 'text', true, true, 3, 'https://www.nltk.org/'),

-- Image Processing
('pillow', 'Pillow (PIL)', 'Python Imaging Library for opening, manipulating, and saving image files', 'image', true, true, 2, 'https://pillow.readthedocs.io/'),

-- File I/O
('openpyxl', 'OpenPyXL', 'Library to read/write Excel 2010 xlsx/xlsm/xltx/xltm files', 'io', true, true, 1, 'https://openpyxl.readthedocs.io/'),
('csv', 'CSV', 'CSV file reading and writing', 'io', true, false, 0, 'https://docs.python.org/3/library/csv.html');

-- Add package tags (JSON arrays)
UPDATE python_packages SET tags = '["fundamental", "array", "numeric"]' WHERE name = 'numpy';
UPDATE python_packages SET tags = '["dataframes", "data-analysis", "csv", "excel"]' WHERE name = 'pandas';
UPDATE python_packages SET tags = '["plotting", "charts", "graphs"]' WHERE name = 'matplotlib';
UPDATE python_packages SET tags = '["machine-learning", "classification", "regression", "clustering"]' WHERE name = 'scikit-learn';
UPDATE python_packages SET tags = '["http", "api", "web-scraping"]' WHERE name = 'requests';
UPDATE python_packages SET tags = '["html", "xml", "parsing", "web-scraping"]' WHERE name = 'beautifulsoup4';
UPDATE python_packages SET tags = '["interactive", "dashboard", "charts"]' WHERE name = 'plotly';
UPDATE python_packages SET tags = '["statistical-plots", "data-visualization"]' WHERE name = 'seaborn';

-- ===================================
-- VIEWS FOR COMMON QUERIES
-- ===================================

-- View to get chapter packages with package details
CREATE VIEW chapter_packages_with_details AS
SELECT 
    cp.id,
    cp.chapter_id,
    cp.required,
    cp.load_order,
    cp.custom_import_name,
    cp.pre_import_code,
    cp.notes,
    pp.name as package_name,
    pp.display_name,
    pp.description,
    pp.category,
    pp.pyodide_compatible,
    pp.install_via_micropip,
    pp.version_constraint,
    pp.load_time_estimate,
    pp.size_mb,
    pp.documentation_url,
    pp.tags
FROM chapter_packages cp
JOIN python_packages pp ON cp.package_id = pp.id
WHERE pp.is_active = true
ORDER BY cp.load_order, pp.name;

-- View to get package set contents with package details
CREATE VIEW package_set_contents AS
SELECT 
    psi.package_set_id,
    ops.name as set_name,
    ops.organization_id,
    psi.load_order,
    psi.required,
    psi.custom_import_name,
    psi.pre_import_code,
    pp.name as package_name,
    pp.display_name,
    pp.description,
    pp.category,
    pp.pyodide_compatible,
    pp.install_via_micropip,
    pp.load_time_estimate
FROM package_set_items psi
JOIN organization_package_sets ops ON psi.package_set_id = ops.id
JOIN python_packages pp ON psi.package_id = pp.id
WHERE pp.is_active = true
ORDER BY psi.load_order, pp.name;

-- ===================================
-- COMMENTS AND DOCUMENTATION
-- ===================================

COMMENT ON TABLE python_packages IS 'Available Python packages that can be loaded in Pyodide environments';
COMMENT ON TABLE chapter_packages IS 'Packages required or suggested for specific chapters';
COMMENT ON TABLE organization_package_sets IS 'Reusable package templates for organizations';
COMMENT ON TABLE package_set_items IS 'Individual packages within a package set';
COMMENT ON TABLE package_load_logs IS 'Performance tracking and error logging for package loads';

-- Migration complete!
-- Next steps:
-- 1. Run this migration in Supabase
-- 2. Test RLS policies with different user roles
-- 3. Create API endpoints for package management
-- 4. Update frontend components to use package system