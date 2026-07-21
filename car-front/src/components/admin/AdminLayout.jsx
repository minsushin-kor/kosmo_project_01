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
    name: "계정 관리",
    path: "/admin/members",
    children: [
      {
        id: 21,
        name: "회원 관리",
        path: "/admin/members",
      },
      {
        id: 22,
        name: "기업 관리",
        path: "/admin/companies",
      },
      {
        id: 23,
        name: "딜러 관리",
        path: "/admin/dealers",
      },
    ],
  },
  {
    id: 3,
    name: "매물 관리",
    path: "/admin/cars",
  },
  {
    id: 4,
    name: "최종 거래 관리",
    path: "/admin/final-deals",
  },
  {
    id: 5,
    name: "신고 관리",
    path: "/admin/reports",
  },
  {
    id: 6,
    name: "공지사항 관리",
    path: "/admin/notices",
  },
  {
    id: 7,
    name: "이탈 위험 관리",
    path: "/admin/churn/company",
    children: [
      {
        id: 61,
        name: "회사 이탈 위험관리",
        path: "/admin/churn/company",
      },
      {
        id: 62,
        name: "딜러 이탈 위험관리",
        path: "/admin/churn/dealer",
      },
    ],
  },
];

function AdminLayout({ title, description, children, actions }) {
  const location = useLocation();

  const isChurnMenuOpen = location.pathname.startsWith("/admin/churn");
  const isAccountMenuOpen = [
    "/admin/members",
    "/admin/companies",
    "/admin/dealers",
  ].some((path) => location.pathname.startsWith(path));

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
              const isMenuOpen =
                menu.name === "계정 관리"
                  ? isAccountMenuOpen
                  : isChurnMenuOpen;

              return (
                <div className="admin-menu-group" key={menu.id}>
                  <NavLink
                    to={menu.path}
                    className={() =>
                      isMenuOpen
                        ? "admin-menu-link active"
                        : "admin-menu-link"
                    }
                  >
                    {menu.name}
                  </NavLink>

                  {isMenuOpen && (
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