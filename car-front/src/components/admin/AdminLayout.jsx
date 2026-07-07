import { NavLink, useLocation } from "react-router-dom";
import "../../css/admin/adminLayout.css";

const adminMenus = [
  {
    id: 1,
    name: "대시보드",
    path: "/admin",
  },
  {
    id: 2,
    name: "회원 관리",
    path: "/admin/members",
  },
  {
    id: 3,
    name: "매물 관리",
    path: "/admin/cars",
  },
  {
    id: 4,
    name: "신고 관리",
    path: "/admin/reports",
  },
  {
    id: 5,
    name: "이탈 위험 관리",
    path: "/admin/churn/company",
    children: [
      {
        id: 51,
        name: "회사 이탈 위험관리",
        path: "/admin/churn/company",
      },
      {
        id: 52,
        name: "딜러 이탈 위험관리",
        path: "/admin/churn/dealer",
      },
    ],
  },
];

function AdminLayout({ title, description, children, actions }) {
  const location = useLocation();

  const isChurnMenuOpen = location.pathname.startsWith("/admin/churn");

  return (
    <main className="admin-layout-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">
          <strong>관리자 메뉴</strong>
          <span>ADMIN</span>
        </div>

        <nav className="admin-sidebar-menu">
          {adminMenus.map((menu) => {
            const hasChildren = menu.children && menu.children.length > 0;

            if (hasChildren) {
              return (
                <div className="admin-menu-group" key={menu.id}>
                  <NavLink
                    to={menu.path}
                    className={() =>
                      isChurnMenuOpen
                        ? "admin-menu-link active"
                        : "admin-menu-link"
                    }
                  >
                    {menu.name}
                  </NavLink>

                  {isChurnMenuOpen && (
                    <div className="admin-sub-menu">
                      {menu.children.map((child) => (
                        <NavLink
                          key={child.id}
                          to={child.path}
                          className={({ isActive }) =>
                            isActive
                              ? "admin-sub-menu-link active"
                              : "admin-sub-menu-link"
                          }
                        >
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={menu.id}
                to={menu.path}
                end={menu.path === "/admin"}
                className={({ isActive }) =>
                  isActive ? "admin-menu-link active" : "admin-menu-link"
                }
              >
                {menu.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <section className="admin-layout-content">
        <div className="admin-layout-header">
          <div>
            <p className="admin-page-label">ADMIN PAGE</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {actions && <div className="admin-header-actions">{actions}</div>}
        </div>

        {children}
      </section>
    </main>
  );
}

export default AdminLayout;